# @voicevault/api

NestJS backend implementing the contract in
`packages/shared/openapi/voicevault.openapi.yaml`.

## Responsibilities

- **Auth** — email+password (bcrypt), OAuth (Google / Microsoft / Apple) via
  authorization-code flow, JWT access tokens + rotating refresh tokens.
- **Recordings** — CRUD, favorites/archive, trash with 30-day retention,
  permanent purge behind `?confirm=true`. Consent acknowledgment is written
  atomically with the recording and is immutable afterwards.
- **Chunked uploads** — clients upload 5-minute chunks (`PUT
  /v1/uploads/sessions/:id/chunks/:seq` with a sha256 header); `complete`
  verifies contiguity, streams the chunks into one S3 object via multipart
  upload, and queues transcription. Interrupted recordings (unknown chunk
  total) salvage the contiguous prefix — partial audio is never dropped.
- **Transcription** — BullMQ queue + worker; provider adapters implement
  `TranscriptionProvider` (word timestamps + detected language + diarization
  where supported). Job states: queued → processing → done → failed, with
  automatic retries and a visible `lastError`.
- **Search** — Postgres `tsvector('simple')` (multilingual, RTL-safe) +
  `pg_trgm` across transcripts, titles, tags, speaker names; the match locator
  maps each hit to its word-level audio timestamp.
- **Sync** — `/v1/sync/push|pull`, last-write-wins with tombstones (shared
  merge logic in `packages/shared/src/sync.ts`).

## Run

```bash
# from voicevault/ root
make dev-infra                       # postgres + redis + minio
npm run migrate --workspace apps/api # apply migrations/*.sql
npm run dev --workspace apps/api     # http://localhost:4000
```

Environment variables: see `voicevault/.env.example` (all keys documented
there). The server fails fast at boot on an invalid environment.

## Tests

```bash
npm run test --workspace apps/api
```

Unit tests cover: chunk assembly & interruption salvage
(`uploads/chunk-assembler.spec.ts`), consent flag persistence & immutability
(`recordings/consent-persistence.spec.ts`), search indexing / query building
(`search/search-query.spec.ts`), search-hit → timestamp mapping incl. Arabic
diacritics (`search/match-locator.spec.ts`), and the Whisper response mapping
(`transcription/providers/whisper-api.provider.spec.ts`).

## Notes & TODOs

- OAuth id_tokens are decoded after TLS exchange with the provider; JWKS
  signature verification is a hardening TODO before production.
- Account export ZIP job is scoped but not yet implemented (`POST
  /v1/account/export` returns job scope).
- The compressed AAC/Opus playback copy (`audio_compressed_key`) requires an
  ffmpeg worker — scheduled with the export worker.
