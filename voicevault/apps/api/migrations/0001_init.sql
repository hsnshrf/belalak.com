-- VoiceVault initial schema.
-- Conventions:
--   * All syncable tables carry (version, updated_at, deleted_at, sync_seq) —
--     LWW + tombstones; sync_seq is a per-user monotonic cursor for /sync/pull.
--   * Full-text search uses the 'simple' regconfig: no language-specific
--     stemming, which keeps Arabic/Farsi/Urdu/Chinese tokens searchable.
--     pg_trgm covers substring & fuzzy matching on titles/tags.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ── Enums ─────────────────────────────────────────────────────────────────────
CREATE TYPE auth_provider   AS ENUM ('email', 'google', 'microsoft', 'apple');
CREATE TYPE source_type     AS ENUM ('mic', 'meeting', 'call');
CREATE TYPE capture_strategy AS ENUM ('mic', 'tab_audio', 'speakerphone', 'voice_call', 'meeting_bot');
CREATE TYPE recording_status AS ENUM ('recording', 'uploading', 'uploaded', 'failed');
CREATE TYPE quality_preset  AS ENUM ('voice', 'standard', 'high');
CREATE TYPE transcription_status AS ENUM ('queued', 'processing', 'done', 'failed');
CREATE TYPE transcription_provider AS ENUM ('whisper_api', 'deepgram', 'local_whisper');
CREATE TYPE transcript_kind AS ENUM ('original', 'edited');
CREATE TYPE upload_session_status AS ENUM ('open', 'assembling', 'complete', 'aborted');
CREATE TYPE ai_artifact_kind AS ENUM ('summary', 'action_items', 'key_topics', 'tag_suggestions', 'category_suggestion');

-- ── Sync cursor ───────────────────────────────────────────────────────────────
-- One global sequence is fine: cursors only need to be monotonic per user.
CREATE SEQUENCE sync_seq_global;

CREATE OR REPLACE FUNCTION bump_sync_seq() RETURNS trigger AS $$
BEGIN
  NEW.sync_seq := nextval('sync_seq_global');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  password_hash text,                       -- NULL for OAuth-only accounts
  display_name  text NOT NULL,
  provider      auth_provider NOT NULL DEFAULT 'email',
  provider_subject text,                    -- OAuth `sub`
  locale        text NOT NULL DEFAULT 'en',
  -- User settings: announcement tone on/off per mode, default quality, local-only mode, etc.
  settings      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz                 -- account deletion tombstone
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX users_oauth_key ON users (provider, provider_subject)
  WHERE provider_subject IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE refresh_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);

-- ── Organization ──────────────────────────────────────────────────────────────
CREATE TABLE folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  uuid REFERENCES folders(id) ON DELETE SET NULL,
  name       text NOT NULL,
  version    bigint NOT NULL DEFAULT 1,
  sync_seq   bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX folders_user_idx ON folders (user_id) WHERE deleted_at IS NULL;
CREATE TRIGGER folders_sync BEFORE INSERT OR UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION bump_sync_seq();

CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  is_default boolean NOT NULL DEFAULT false, -- seeded: Business/Personal/Meetings/Calls/Ideas
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX categories_user_name_key ON categories (user_id, lower(name));

CREATE TABLE tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  version    bigint NOT NULL DEFAULT 1,
  sync_seq   bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX tags_user_name_key ON tags (user_id, lower(name)) WHERE deleted_at IS NULL;
-- trigram index → fast autocomplete (ILIKE '%q%') and fuzzy tag search
CREATE INDEX tags_name_trgm ON tags USING gin (name gin_trgm_ops);
CREATE TRIGGER tags_sync BEFORE INSERT OR UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION bump_sync_seq();

-- ── Recordings ────────────────────────────────────────────────────────────────
CREATE TABLE recordings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Client-generated id: offline-first mobile creates rows locally and pushes
  -- them later; the pair (user_id, client_id) makes creation idempotent.
  client_id          uuid,
  title              text NOT NULL,
  folder_id          uuid REFERENCES folders(id) ON DELETE SET NULL,
  category_id        uuid REFERENCES categories(id) ON DELETE SET NULL,
  source_type        source_type NOT NULL,
  capture_strategy   capture_strategy,
  status             recording_status NOT NULL DEFAULT 'recording',
  quality_preset     quality_preset NOT NULL DEFAULT 'standard',
  duration_seconds   numeric(10,3),
  size_bytes         bigint,
  original_mime      text,
  -- S3 object keys: the untouched original and a compressed AAC/Opus copy.
  audio_original_key   text,
  audio_compressed_key text,
  language_dominant  text,                  -- BCP-47, from transcription
  -- Consent & compliance (docs/consent.md): both fields are immutable once set.
  consent_acknowledged    boolean NOT NULL DEFAULT false,
  consent_acknowledged_at timestamptz,
  announcement_played     boolean NOT NULL DEFAULT false,
  is_favorite        boolean NOT NULL DEFAULT false,
  archived_at        timestamptz,
  trashed_at         timestamptz,
  purge_after        timestamptz,           -- trashed_at + 30 days
  recorded_at        timestamptz NOT NULL,
  version            bigint NOT NULL DEFAULT 1,
  sync_seq           bigint NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz,           -- hard-delete tombstone (post-purge)
  title_tsv          tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title, ''))) STORED
);
CREATE UNIQUE INDEX recordings_client_key ON recordings (user_id, client_id) WHERE client_id IS NOT NULL;
CREATE INDEX recordings_user_idx ON recordings (user_id, recorded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX recordings_folder_idx ON recordings (folder_id) WHERE deleted_at IS NULL;
CREATE INDEX recordings_title_tsv_idx ON recordings USING gin (title_tsv);
CREATE INDEX recordings_title_trgm ON recordings USING gin (title gin_trgm_ops);
CREATE INDEX recordings_sync_idx ON recordings (user_id, sync_seq);
CREATE TRIGGER recordings_sync BEFORE INSERT OR UPDATE ON recordings
  FOR EACH ROW EXECUTE FUNCTION bump_sync_seq();

CREATE TABLE recording_tags (
  recording_id uuid NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  tag_id       uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recording_id, tag_id)
);

-- ── Chunked upload ────────────────────────────────────────────────────────────
CREATE TABLE upload_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mime_type    text NOT NULL,
  total_chunks integer,                    -- NULL while the client is still recording
  status       upload_session_status NOT NULL DEFAULT 'open',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX upload_sessions_recording_idx ON upload_sessions (recording_id);

CREATE TABLE upload_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
  seq         integer NOT NULL,
  size_bytes  bigint NOT NULL,
  sha256      text NOT NULL,
  storage_key text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, seq)                 -- retries are idempotent per seq
);

-- ── Transcription ─────────────────────────────────────────────────────────────
CREATE TABLE transcript_jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  provider     transcription_provider NOT NULL,
  status       transcription_status NOT NULL DEFAULT 'queued',
  attempts     integer NOT NULL DEFAULT 0,
  last_error   text,
  queued_at    timestamptz NOT NULL DEFAULT now(),
  started_at   timestamptz,
  finished_at  timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transcript_jobs_recording_idx ON transcript_jobs (recording_id, queued_at DESC);

CREATE TABLE transcripts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  kind         transcript_kind NOT NULL,
  text         text NOT NULL,
  language     text,                        -- dominant language, BCP-47
  -- Array of segments; each segment: {id, start, end, speaker, language, text,
  -- words: [{w, s, e}]} — word-level timestamps drive tap-to-seek and search
  -- match positions.
  segments     jsonb NOT NULL DEFAULT '[]'::jsonb,
  provider     transcription_provider,
  provider_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version      bigint NOT NULL DEFAULT 1,
  sync_seq     bigint NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  text_tsv     tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(text, ''))) STORED,
  UNIQUE (recording_id, kind)              -- 'original' is immutable; 'edited' holds user corrections
);
CREATE INDEX transcripts_tsv_idx ON transcripts USING gin (text_tsv);
CREATE INDEX transcripts_text_trgm ON transcripts USING gin (text gin_trgm_ops);
CREATE TRIGGER transcripts_sync BEFORE INSERT OR UPDATE ON transcripts
  FOR EACH ROW EXECUTE FUNCTION bump_sync_seq();

CREATE TABLE speakers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  label        text NOT NULL,               -- provider key, e.g. 'S1'
  display_name text,                        -- user rename, persisted
  UNIQUE (recording_id, label)
);
-- speaker names are searchable
CREATE INDEX speakers_name_trgm ON speakers USING gin ((coalesce(display_name, label)) gin_trgm_ops);

-- ── AI artifacts ──────────────────────────────────────────────────────────────
CREATE TABLE ai_artifacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  kind         ai_artifact_kind NOT NULL,
  content      jsonb NOT NULL,
  model        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_artifacts_recording_idx ON ai_artifacts (recording_id, kind, created_at DESC);

-- ── Share links ───────────────────────────────────────────────────────────────
CREATE TABLE share_links (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Devices (sync bookkeeping) ────────────────────────────────────────────────
CREATE TABLE devices (
  id            text PRIMARY KEY,           -- client-generated stable id
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          text,
  last_pull_seq bigint NOT NULL DEFAULT 0,
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);
