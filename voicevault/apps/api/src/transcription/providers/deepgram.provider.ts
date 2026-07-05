import { Injectable } from "@nestjs/common";
import type { TranscriptSegment } from "@voicevault/shared";
import { config } from "../../config";
import type {
  TranscriptionInput,
  TranscriptionProvider,
  TranscriptionResult,
} from "../provider.interface";

/** Fields we consume from Deepgram's prerecorded response. */
export interface DeepgramResponse {
  results?: {
    channels?: {
      detected_language?: string;
      alternatives?: {
        transcript?: string;
        words?: {
          word: string;
          start: number;
          end: number;
          speaker?: number;
          language?: string;
          punctuated_word?: string;
        }[];
      }[];
    }[];
    utterances?: {
      start: number;
      end: number;
      transcript: string;
      speaker?: number;
      words?: { word: string; start: number; end: number; punctuated_word?: string }[];
    }[];
  };
}

/**
 * Deepgram adapter.
 *  - auto language detection: yes (detect_language)
 *  - word timestamps: yes
 *  - diarization: YES (utterances + speaker index → "S{n+1}")
 */
@Injectable()
export class DeepgramProvider implements TranscriptionProvider {
  readonly id = "deepgram" as const;
  readonly supportsDiarization = true;

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const cfg = config();
    if (!cfg.DEEPGRAM_API_KEY) {
      throw new Error("DEEPGRAM_API_KEY is not configured — cannot run deepgram transcription");
    }
    const params = new URLSearchParams({
      model: cfg.DEEPGRAM_MODEL,
      detect_language: "true",
      diarize: "true",
      utterances: "true",
      punctuate: "true",
      smart_format: "true",
    });
    if (input.languageHint) params.set("language", input.languageHint);

    const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: "POST",
      headers: {
        authorization: `Token ${cfg.DEEPGRAM_API_KEY}`,
        "content-type": input.mimeType,
      },
      body: new Uint8Array(input.audio),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Deepgram failed (${res.status}): ${detail.slice(0, 500)}`);
    }
    return mapDeepgramResponse((await res.json()) as DeepgramResponse);
  }
}

/** Pure mapping from Deepgram's response to our transcript model. */
export function mapDeepgramResponse(body: DeepgramResponse): TranscriptionResult {
  const channel = body.results?.channels?.[0];
  const language = channel?.detected_language ?? null;
  const utterances = body.results?.utterances ?? [];
  const speakers = new Set<string>();

  let segments: TranscriptSegment[];
  if (utterances.length > 0) {
    segments = utterances.map((u, i) => {
      const speaker = u.speaker !== undefined ? `S${u.speaker + 1}` : null;
      if (speaker) speakers.add(speaker);
      return {
        id: `seg-${i}`,
        start: u.start,
        end: u.end,
        speaker,
        language, // deepgram reports language per channel, not per utterance
        text: u.transcript.trim(),
        words: (u.words ?? []).map((w) => ({ w: (w.punctuated_word ?? w.word).trim(), s: w.start, e: w.end })),
      };
    });
  } else {
    const alt = channel?.alternatives?.[0];
    const words = alt?.words ?? [];
    segments = [
      {
        id: "seg-0",
        start: words[0]?.start ?? 0,
        end: words.at(-1)?.end ?? 0,
        speaker: null,
        language,
        text: (alt?.transcript ?? "").trim(),
        words: words.map((w) => ({ w: (w.punctuated_word ?? w.word).trim(), s: w.start, e: w.end })),
      },
    ];
  }

  return {
    language,
    text: segments.map((s) => s.text).join(" ").trim(),
    segments,
    speakers: [...speakers].sort(),
    providerMetadata: { utteranceCount: utterances.length },
  };
}
