import { z } from "zod";
import {
  AI_ARTIFACT_KINDS,
  CAPTURE_STRATEGIES,
  EXPORT_FORMATS,
  SOURCE_TYPES,
  TRANSCRIPTION_PROVIDERS,
  TRANSCRIPTION_STATUSES,
} from "./constants";

// ── Primitives ────────────────────────────────────────────────────────────────

export const uuid = z.string().uuid();
export const isoDate = z.string().datetime({ offset: true });

// ── Transcript payloads ───────────────────────────────────────────────────────

/** One word with start/end offsets in seconds from the beginning of the audio. */
export const wordSchema = z.object({
  w: z.string(),
  s: z.number().nonnegative(),
  e: z.number().nonnegative(),
});
export type Word = z.infer<typeof wordSchema>;

export const transcriptSegmentSchema = z.object({
  id: z.string(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  /** Stable speaker key, e.g. "S1". Display names live in the speakers table. */
  speaker: z.string().nullable(),
  /** BCP-47 tag for this segment where the provider reports per-segment language. */
  language: z.string().nullable(),
  text: z.string(),
  words: z.array(wordSchema),
});
export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;

export const transcriptKindSchema = z.enum(["original", "edited"]);
export type TranscriptKind = z.infer<typeof transcriptKindSchema>;

export const transcriptSchema = z.object({
  id: uuid,
  recordingId: uuid,
  kind: transcriptKindSchema,
  text: z.string(),
  /** Dominant language of the whole recording (BCP-47), if detected. */
  language: z.string().nullable(),
  segments: z.array(transcriptSegmentSchema),
  provider: z.enum(TRANSCRIPTION_PROVIDERS).nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type Transcript = z.infer<typeof transcriptSchema>;

export const speakerSchema = z.object({
  id: uuid,
  recordingId: uuid,
  /** Provider-assigned key, e.g. "S1" → shown as "Speaker 1" until renamed. */
  label: z.string(),
  displayName: z.string().nullable(),
});
export type Speaker = z.infer<typeof speakerSchema>;

// ── Recordings ────────────────────────────────────────────────────────────────

export const recordingStatusSchema = z.enum([
  "recording",
  "uploading",
  "uploaded",
  "failed",
]);
export type RecordingStatus = z.infer<typeof recordingStatusSchema>;

export const recordingSchema = z.object({
  id: uuid,
  userId: uuid,
  title: z.string(),
  folderId: uuid.nullable(),
  categoryId: uuid.nullable(),
  sourceType: z.enum(SOURCE_TYPES),
  captureStrategy: z.enum(CAPTURE_STRATEGIES).nullable(),
  status: recordingStatusSchema,
  qualityPreset: z.enum(["voice", "standard", "high"]),
  durationSeconds: z.number().nonnegative().nullable(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  languageDominant: z.string().nullable(),
  transcriptionStatus: z.enum(TRANSCRIPTION_STATUSES).nullable(),
  /** Consent & compliance — see docs/consent.md. */
  consentAcknowledged: z.boolean(),
  consentAcknowledgedAt: isoDate.nullable(),
  announcementPlayed: z.boolean(),
  isFavorite: z.boolean(),
  archivedAt: isoDate.nullable(),
  trashedAt: isoDate.nullable(),
  recordedAt: isoDate,
  createdAt: isoDate,
  updatedAt: isoDate,
  tagIds: z.array(uuid),
});
export type Recording = z.infer<typeof recordingSchema>;

export const createRecordingSchema = z.object({
  /** Client-generated UUID so offline-created recordings upload idempotently. */
  clientId: uuid,
  title: z.string().min(1).max(300).optional(),
  sourceType: z.enum(SOURCE_TYPES),
  captureStrategy: z.enum(CAPTURE_STRATEGIES),
  qualityPreset: z.enum(["voice", "standard", "high"]).default("standard"),
  recordedAt: isoDate,
  consentAcknowledged: z.boolean().default(false),
  announcementPlayed: z.boolean().default(false),
  folderId: uuid.nullable().optional(),
  categoryId: uuid.nullable().optional(),
});
export type CreateRecordingInput = z.infer<typeof createRecordingSchema>;

// ── Chunked upload ────────────────────────────────────────────────────────────

export const openUploadSessionSchema = z.object({
  recordingId: uuid,
  mimeType: z.string(),
  /** Omitted while still recording; set when the client knows the final count. */
  totalChunks: z.number().int().positive().nullable().optional(),
});
export type OpenUploadSessionInput = z.infer<typeof openUploadSessionSchema>;

export const uploadChunkMetaSchema = z.object({
  seq: z.number().int().nonnegative(),
  sizeBytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  /** True on the final chunk; triggers assembly. */
  isLast: z.boolean().default(false),
});
export type UploadChunkMeta = z.infer<typeof uploadChunkMetaSchema>;

// ── Organization ──────────────────────────────────────────────────────────────

export const folderSchema = z.object({
  id: uuid,
  parentId: uuid.nullable(),
  name: z.string().min(1).max(120),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type Folder = z.infer<typeof folderSchema>;

export const categorySchema = z.object({
  id: uuid,
  name: z.string().min(1).max(60),
  isDefault: z.boolean(),
});
export type Category = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  id: uuid,
  name: z.string().min(1).max(60),
});
export type Tag = z.infer<typeof tagSchema>;

// ── Search ────────────────────────────────────────────────────────────────────

export const searchFiltersSchema = z.object({
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  language: z.string().optional(),
  categoryId: uuid.optional(),
  tagIds: z.array(uuid).optional(),
  folderId: uuid.optional(),
  minDurationSeconds: z.number().nonnegative().optional(),
  maxDurationSeconds: z.number().nonnegative().optional(),
  sourceType: z.enum(SOURCE_TYPES).optional(),
});
export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export const searchRequestSchema = searchFiltersSchema.extend({
  q: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});
export type SearchRequest = z.infer<typeof searchRequestSchema>;

/** One keyword hit inside one recording, with the audio position to seek to. */
export const searchMatchSchema = z.object({
  /** Seconds into the audio where the matched word starts. */
  timeSeconds: z.number().nonnegative().nullable(),
  segmentId: z.string().nullable(),
  /** Snippet with <mark>…</mark> around the matched terms. */
  snippetHtml: z.string(),
});
export type SearchMatch = z.infer<typeof searchMatchSchema>;

export const searchResultSchema = z.object({
  recordingId: uuid,
  title: z.string(),
  recordedAt: isoDate,
  language: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  matches: z.array(searchMatchSchema),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

// ── AI artifacts ──────────────────────────────────────────────────────────────

export const aiArtifactSchema = z.object({
  id: uuid,
  recordingId: uuid,
  kind: z.enum(AI_ARTIFACT_KINDS),
  content: z.unknown(),
  model: z.string().nullable(),
  createdAt: isoDate,
});
export type AiArtifact = z.infer<typeof aiArtifactSchema>;

// ── Exports ───────────────────────────────────────────────────────────────────

export const exportRequestSchema = z.object({
  format: z.enum(EXPORT_FORMATS),
  /** Which transcript to export when edits exist. */
  transcriptKind: transcriptKindSchema.default("edited"),
});
export type ExportRequest = z.infer<typeof exportRequestSchema>;

// ── Auth ──────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(200),
  displayName: z.string().min(1).max(120),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresInSeconds: z.number().int(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;
