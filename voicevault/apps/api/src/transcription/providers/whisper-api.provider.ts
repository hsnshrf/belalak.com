import { Injectable } from "@nestjs/common";
import type { TranscriptSegment, Word } from "@voicevault/shared";
import { config } from "../../config";
import type {
  TranscriptionInput,
  TranscriptionProvider,
  TranscriptionResult,
} from "../provider.interface";

/** Shape of OpenAI's verbose_json transcription response (fields we use). */
export interface WhisperVerboseResponse {
  language?: string;
  text: string;
  segments?: { id: number; start: number; end: number; text: string }[];
  words?: { word: string; start: number; end: number }[];
}

/**
 * OpenAI Whisper API adapter.
 *  - auto language detection: yes (response.language)
 *  - word timestamps: yes (timestamp_granularities[]=word)
 *  - diarization: NO — whisper-1 does not label speakers; segments carry
 *    speaker=null and the UI shows an undifferentiated transcript.
 */
@Injectable()
export class WhisperApiProvider implements TranscriptionProvider {
  readonly id = "whisper_api" as const;
  readonly supportsDiarization = false;

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const cfg = config();
    if (!cfg.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured — cannot run whisper_api transcription");
    }
    const form = new FormData();
    form.append("file", new Blob([input.audio], { type: input.mimeType }), input.fileName);
    form.append("model", cfg.OPENAI_WHISPER_MODEL);
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");
    form.append("timestamp_granularities[]", "segment");
    if (input.languageHint) form.append("language", input.languageHint);

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.OPENAI_API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Whisper API failed (${res.status}): ${detail.slice(0, 500)}`);
    }
    const body = (await res.json()) as WhisperVerboseResponse;
    return mapWhisperResponse(body);
  }
}

/**
 * Pure mapping from Whisper's verbose_json to our transcript model — words
 * are bucketed into their enclosing segment by midpoint time.
 */
export function mapWhisperResponse(body: WhisperVerboseResponse): TranscriptionResult {
  const words: Word[] = (body.words ?? []).map((w) => ({ w: w.word.trim(), s: w.start, e: w.end }));
  const rawSegments = body.segments?.length
    ? body.segments
    : [{ id: 0, start: words[0]?.s ?? 0, end: words.at(-1)?.e ?? 0, text: body.text }];

  const segments: TranscriptSegment[] = rawSegments.map((seg) => ({
    id: `seg-${seg.id}`,
    start: seg.start,
    end: seg.end,
    speaker: null, // whisper-1 has no diarization
    language: body.language ?? null,
    text: seg.text.trim(),
    words: words.filter((w) => {
      const mid = (w.s + w.e) / 2;
      return mid >= seg.start && mid < seg.end;
    }),
  }));

  // Words that fall exactly on the tail boundary belong to the last segment.
  const last = segments.at(-1);
  if (last) {
    const assigned = new Set(segments.flatMap((s) => s.words));
    for (const w of words) if (!assigned.has(w)) last.words.push(w);
  }

  return {
    language: normalizeLanguage(body.language),
    text: body.text.trim(),
    segments,
    speakers: [],
    providerMetadata: { model: "whisper", segmentCount: segments.length },
  };
}

/** Whisper returns full names ("english"); normalize the common ones to BCP-47. */
export function normalizeLanguage(lang: string | undefined): string | null {
  if (!lang) return null;
  const table: Record<string, string> = {
    english: "en", arabic: "ar", persian: "fa", farsi: "fa", hindi: "hi",
    urdu: "ur", french: "fr", spanish: "es", german: "de", russian: "ru",
    turkish: "tr", chinese: "zh", mandarin: "zh", japanese: "ja",
    portuguese: "pt", italian: "it", dutch: "nl", korean: "ko",
  };
  const lower = lang.toLowerCase();
  return table[lower] ?? (lower.length <= 3 ? lower : lower.slice(0, 2));
}
