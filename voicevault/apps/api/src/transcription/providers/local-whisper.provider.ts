import { Injectable } from "@nestjs/common";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { config } from "../../config";
import { mapWhisperResponse, type WhisperVerboseResponse } from "./whisper-api.provider";
import type {
  TranscriptionInput,
  TranscriptionProvider,
  TranscriptionResult,
} from "../provider.interface";

const execFileAsync = promisify(execFile);

/**
 * Self-hosted adapter: shells out to whisper.cpp (`whisper-cli`) so audio
 * never leaves the server — the backing option for "local-only mode".
 *
 * Requirements (see .env.example):
 *   WHISPER_CPP_BINARY  path to whisper.cpp's CLI (built with -oj support)
 *   WHISPER_CPP_MODEL   path to a ggml model (large-v3 recommended for
 *                       multilingual incl. Arabic/Farsi/Urdu)
 *
 *  - auto language detection: yes (--language auto)
 *  - word timestamps: yes (token-level via -oj JSON output, mapped to words)
 *  - diarization: NO (whisper.cpp tinydiarize is English-only; not claimed)
 */
@Injectable()
export class LocalWhisperProvider implements TranscriptionProvider {
  readonly id = "local_whisper" as const;
  readonly supportsDiarization = false;

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const cfg = config();
    if (!cfg.WHISPER_CPP_BINARY || !cfg.WHISPER_CPP_MODEL) {
      throw new Error("WHISPER_CPP_BINARY / WHISPER_CPP_MODEL not configured for local_whisper");
    }
    const dir = await mkdtemp(join(tmpdir(), "vv-whisper-"));
    try {
      const audioPath = join(dir, input.fileName);
      await writeFile(audioPath, input.audio);
      const outBase = join(dir, "out");
      // whisper.cpp accepts wav natively; other containers require ffmpeg.
      // The worker stores originals as-is, so convert when needed.
      const wavPath = input.fileName.endsWith(".wav") ? audioPath : join(dir, "audio.wav");
      if (wavPath !== audioPath) {
        await execFileAsync("ffmpeg", ["-y", "-i", audioPath, "-ar", "16000", "-ac", "1", wavPath], {
          timeout: 10 * 60_000,
        });
      }
      await execFileAsync(
        cfg.WHISPER_CPP_BINARY,
        ["-m", cfg.WHISPER_CPP_MODEL, "-f", wavPath, "--language", "auto", "-oj", "-of", outBase],
        { timeout: 60 * 60_000, maxBuffer: 64 * 1024 * 1024 },
      );
      const raw = JSON.parse(await readFile(`${outBase}.json`, "utf8")) as WhisperCppOutput;
      return mapWhisperResponse(toVerboseShape(raw));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

interface WhisperCppOutput {
  result?: { language?: string };
  transcription?: {
    text: string;
    offsets: { from: number; to: number }; // milliseconds
    tokens?: { text: string; offsets: { from: number; to: number } }[];
  }[];
}

/** Adapt whisper.cpp's JSON to the Whisper-API verbose shape we already map. */
export function toVerboseShape(raw: WhisperCppOutput): WhisperVerboseResponse {
  const segments = (raw.transcription ?? []).map((seg, i) => ({
    id: i,
    start: seg.offsets.from / 1000,
    end: seg.offsets.to / 1000,
    text: seg.text,
  }));
  const words = (raw.transcription ?? []).flatMap((seg) =>
    (seg.tokens ?? [])
      .filter((t) => !t.text.startsWith("[_")) // drop control tokens like [_BEG_]
      .map((t) => ({ word: t.text.trim(), start: t.offsets.from / 1000, end: t.offsets.to / 1000 }))
      .filter((w) => w.word.length > 0),
  );
  return {
    language: raw.result?.language,
    text: segments.map((s) => s.text.trim()).join(" "),
    segments,
    words,
  };
}
