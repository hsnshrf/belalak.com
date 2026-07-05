import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { TRANSCRIPTION_MAX_ATTEMPTS, type TranscriptionProviderId } from "@voicevault/shared";
import { Queue, type RedisOptions } from "bullmq";
import { config } from "../config";
import { DbService } from "../db/db.service";

export const TRANSCRIPTION_QUEUE = "transcription";

export interface TranscriptionJobData {
  jobId: string;
  recordingId: string;
  provider: TranscriptionProviderId;
}

/** BullMQ instantiates its own Redis clients from these options. */
export function redisOptionsFromUrl(url: string): RedisOptions {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 6379,
    username: u.username || undefined,
    password: u.password || undefined,
    db: u.pathname && u.pathname !== "/" ? Number(u.pathname.slice(1)) : 0,
    maxRetriesPerRequest: null,
  };
}

@Injectable()
export class TranscriptionQueue implements OnModuleDestroy {
  readonly redisOptions = redisOptionsFromUrl(config().REDIS_URL);
  private readonly queue = new Queue<TranscriptionJobData, void, string>(TRANSCRIPTION_QUEUE, {
    connection: this.redisOptions,
  });

  constructor(private readonly db: DbService) {}

  /** Create a job row (status=queued) and enqueue it with retry/backoff. */
  async enqueue(recordingId: string, provider?: TranscriptionProviderId): Promise<string> {
    const chosen = provider ?? config().TRANSCRIPTION_PROVIDER;
    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO transcript_jobs (recording_id, provider) VALUES ($1, $2) RETURNING id`,
      [recordingId, chosen],
    );
    const jobId = rows[0]!.id;
    await this.queue.add(
      "transcribe",
      { jobId, recordingId, provider: chosen },
      {
        attempts: TRANSCRIPTION_MAX_ATTEMPTS,
        backoff: { type: "exponential", delay: 10_000 },
        removeOnComplete: 1000,
        removeOnFail: false,
      },
    );
    return jobId;
  }

  async status(recordingId: string) {
    const { rows } = await this.db.query(
      `SELECT recording_id AS "recordingId", status, provider, attempts, last_error AS "lastError"
       FROM transcript_jobs WHERE recording_id = $1 ORDER BY queued_at DESC LIMIT 1`,
      [recordingId],
    );
    return rows[0] ?? { recordingId, status: null };
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
