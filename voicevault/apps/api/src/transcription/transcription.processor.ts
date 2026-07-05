import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common";
import type { TranscriptSegment } from "@voicevault/shared";
import { Worker, type Job } from "bullmq";
import { DbService } from "../db/db.service";
import { StorageService } from "../storage/storage.service";
import { WhisperApiProvider } from "./providers/whisper-api.provider";
import type { TranscriptionProvider, TranscriptionResult } from "./provider.interface";
import {
  TRANSCRIPTION_QUEUE,
  TranscriptionQueue,
  type TranscriptionJobData,
} from "./transcription.queue";

/**
 * Background transcription worker. Job lifecycle mirrors the transcript_jobs
 * row: queued → processing → done | failed. BullMQ retries with exponential
 * backoff; the row keeps attempts/last_error so failures are visible (and
 * retryable) in the UI, never silent.
 */
@Injectable()
export class TranscriptionProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(TranscriptionProcessor.name);
  private worker?: Worker<TranscriptionJobData>;
  private readonly providers = new Map<string, TranscriptionProvider>();

  constructor(
    private readonly db: DbService,
    private readonly storage: StorageService,
    private readonly queue: TranscriptionQueue,
    whisper: WhisperApiProvider,
  ) {
    this.register(whisper);
  }

  /** Additional adapters (Deepgram, local whisper.cpp) self-register here. */
  register(provider: TranscriptionProvider): void {
    this.providers.set(provider.id, provider);
  }

  onModuleInit(): void {
    if (process.env.NODE_ENV === "test") return;
    this.worker = new Worker<TranscriptionJobData>(
      TRANSCRIPTION_QUEUE,
      (job) => this.process(job),
      { connection: this.queue.redisOptions, concurrency: 2 },
    );
    this.worker.on("failed", (job, err) => {
      this.log.error(`transcription job ${job?.id} failed: ${err.message}`);
    });
  }

  async process(job: Job<TranscriptionJobData>): Promise<void> {
    const { jobId, recordingId, provider: providerId } = job.data;
    const provider = this.providers.get(providerId);
    await this.db.query(
      "UPDATE transcript_jobs SET status = 'processing', attempts = attempts + 1, started_at = coalesce(started_at, now()), updated_at = now() WHERE id = $1",
      [jobId],
    );
    try {
      if (!provider) throw new Error(`No adapter registered for provider ${providerId}`);
      const rec = await this.db.query<{ audio_original_key: string | null; original_mime: string | null; title: string }>(
        "SELECT audio_original_key, original_mime, title FROM recordings WHERE id = $1 AND deleted_at IS NULL",
        [recordingId],
      );
      const row = rec.rows[0];
      if (!row?.audio_original_key) throw new Error("Recording has no uploaded audio");

      const audio = await this.storage.getObjectBuffer(row.audio_original_key);
      const result = await provider.transcribe({
        audio,
        mimeType: row.original_mime ?? "audio/webm",
        fileName: `recording.${extensionFor(row.original_mime)}`,
      });

      await this.persistResult(recordingId, providerId, result, row.title);
      await this.db.query(
        "UPDATE transcript_jobs SET status = 'done', finished_at = now(), updated_at = now() WHERE id = $1",
        [jobId],
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      await this.db.query(
        `UPDATE transcript_jobs SET status = $2, last_error = $3, updated_at = now(),
           finished_at = CASE WHEN $2 = 'failed' THEN now() ELSE finished_at END
         WHERE id = $1`,
        [jobId, isFinalAttempt ? "failed" : "queued", message.slice(0, 2000)],
      );
      throw err; // let BullMQ drive the retry/backoff
    }
  }

  private async persistResult(
    recordingId: string,
    providerId: string,
    result: TranscriptionResult,
    currentTitle: string,
  ): Promise<void> {
    // The original transcript is immutable: written once, only ever replaced
    // by a full re-transcription (which is a new job on the same kind).
    await this.db.query(
      `INSERT INTO transcripts (recording_id, kind, text, language, segments, provider, provider_metadata)
       VALUES ($1, 'original', $2, $3, $4::jsonb, $5, $6::jsonb)
       ON CONFLICT (recording_id, kind) DO UPDATE SET
         text = EXCLUDED.text, language = EXCLUDED.language, segments = EXCLUDED.segments,
         provider = EXCLUDED.provider, provider_metadata = EXCLUDED.provider_metadata,
         version = transcripts.version + 1`,
      [
        recordingId,
        result.text,
        result.language,
        JSON.stringify(result.segments),
        providerId,
        JSON.stringify(result.providerMetadata),
      ],
    );
    for (const label of result.speakers) {
      await this.db.query(
        "INSERT INTO speakers (recording_id, label) VALUES ($1, $2) ON CONFLICT (recording_id, label) DO NOTHING",
        [recordingId, label],
      );
    }
    await this.db.query(
      "UPDATE recordings SET language_dominant = $2, version = version + 1 WHERE id = $1",
      [recordingId, result.language],
    );
    // Default title = date + time + first topic: append the opening words as a
    // cheap "first topic" until the AI topics artifact refines it.
    const opener = firstTopicFrom(result.segments, result.text);
    if (opener && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(currentTitle)) {
      await this.db.query("UPDATE recordings SET title = $2, version = version + 1 WHERE id = $1", [
        recordingId,
        `${currentTitle} — ${opener}`,
      ]);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}

export function firstTopicFrom(segments: TranscriptSegment[], fullText: string): string | null {
  const text = (segments[0]?.text ?? fullText).trim();
  if (!text) return null;
  const words = text.split(/\s+/).slice(0, 6).join(" ");
  return words.length > 60 ? words.slice(0, 57) + "…" : words;
}

function extensionFor(mime: string | null): string {
  if (!mime) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4") || mime.includes("aac") || mime.includes("m4a")) return "m4a";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  return "webm";
}
