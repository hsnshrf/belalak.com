import type { TranscriptSegment, TranscriptionProviderId } from "@voicevault/shared";

/**
 * Provider-agnostic transcription contract. Every adapter must return
 * word-level timestamps and the detected language; diarization is surfaced
 * where the provider supports it (segments[].speaker stays null otherwise).
 */
export interface TranscriptionInput {
  audio: Buffer;
  mimeType: string;
  fileName: string;
  /** Hint only — adapters must still auto-detect. */
  languageHint?: string;
}

export interface TranscriptionResult {
  /** Dominant language of the recording, BCP-47 (e.g. "en", "ar"). */
  language: string | null;
  text: string;
  segments: TranscriptSegment[];
  /** Distinct speaker keys found (e.g. ["S1","S2"]); empty without diarization. */
  speakers: string[];
  providerMetadata: Record<string, unknown>;
}

export interface TranscriptionProvider {
  readonly id: TranscriptionProviderId;
  /** Whether this adapter can label distinct speakers. */
  readonly supportsDiarization: boolean;
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}
