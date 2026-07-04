/**
 * Cross-app constants. The mobile app mirrors these in
 * apps/mobile/lib/core/constants.dart — keep the two in sync.
 */

/** Maximum length of a single recording. */
export const MAX_RECORDING_SECONDS = 6 * 60 * 60; // 6 hours

/**
 * Long recordings are uploaded in rolling chunks so connectivity loss never
 * costs more than one chunk of audio.
 */
export const UPLOAD_CHUNK_SECONDS = 5 * 60; // 5 minutes

/** Trash retention before permanent, irreversible deletion. */
export const TRASH_RETENTION_DAYS = 30;

export const QUALITY_PRESETS = {
  voice: { codec: "opus", bitrateKbps: 32, label: "Voice-optimized" },
  standard: { codec: "opus", bitrateKbps: 64, label: "Standard" },
  high: { codec: "aac", bitrateKbps: 128, label: "High" },
} as const;

export type QualityPreset = keyof typeof QUALITY_PRESETS;

export const SOURCE_TYPES = ["mic", "meeting", "call"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/**
 * How the audio was actually captured. Only combinations that are genuinely
 * possible on each platform are offered in the UIs:
 *  - `mic`          plain microphone (all platforms)
 *  - `tab_audio`    getDisplayMedia tab/window audio mixed with mic (desktop web)
 *  - `speakerphone` mic capture of a loudspeaker call/meeting (mobile)
 *  - `voice_call`   Android AudioSource.VOICE_CALL where the OEM permits it
 *  - `meeting_bot`  server-side bot participant (phase 2, scaffold only)
 */
export const CAPTURE_STRATEGIES = [
  "mic",
  "tab_audio",
  "speakerphone",
  "voice_call",
  "meeting_bot",
] as const;
export type CaptureStrategy = (typeof CAPTURE_STRATEGIES)[number];

export const TRANSCRIPTION_STATUSES = [
  "queued",
  "processing",
  "done",
  "failed",
] as const;
export type TranscriptionStatus = (typeof TRANSCRIPTION_STATUSES)[number];

export const TRANSCRIPTION_PROVIDERS = [
  "whisper_api",
  "deepgram",
  "local_whisper",
] as const;
export type TranscriptionProviderId = (typeof TRANSCRIPTION_PROVIDERS)[number];

/** Max automatic retries for a failed transcription job. */
export const TRANSCRIPTION_MAX_ATTEMPTS = 3;

export const DEFAULT_CATEGORIES = [
  "Business",
  "Personal",
  "Meetings",
  "Calls",
  "Ideas",
] as const;

export const AI_ARTIFACT_KINDS = [
  "summary",
  "action_items",
  "key_topics",
  "tag_suggestions",
  "category_suggestion",
] as const;
export type AiArtifactKind = (typeof AI_ARTIFACT_KINDS)[number];

export const EXPORT_FORMATS = ["txt", "docx", "pdf", "srt"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** UI locales shipped at launch. RTL locales get dir="rtl" layouts. */
export const UI_LOCALES = ["en", "ar"] as const;
export type UiLocale = (typeof UI_LOCALES)[number];
export const RTL_LOCALES: ReadonlySet<string> = new Set(["ar", "fa", "ur", "he"]);
