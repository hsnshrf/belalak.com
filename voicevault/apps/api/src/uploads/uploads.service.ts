import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { OpenUploadSessionInput } from "@voicevault/shared";
import { DbService } from "../db/db.service";
import { StorageService } from "../storage/storage.service";
import { TranscriptionQueue } from "../transcription/transcription.queue";
import { planAssembly, verifyChunkChecksum } from "./chunk-assembler";

@Injectable()
export class UploadsService {
  constructor(
    private readonly db: DbService,
    private readonly storage: StorageService,
    private readonly queue: TranscriptionQueue,
  ) {}

  async openSession(userId: string, input: OpenUploadSessionInput): Promise<{ sessionId: string }> {
    const rec = await this.db.query<{ id: string }>(
      "SELECT id FROM recordings WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
      [input.recordingId, userId],
    );
    if (rec.rowCount === 0) throw new NotFoundException("Recording not found");
    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO upload_sessions (recording_id, user_id, mime_type, total_chunks)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [input.recordingId, userId, input.mimeType, input.totalChunks ?? null],
    );
    await this.db.query("UPDATE recordings SET status = 'uploading', version = version + 1 WHERE id = $1", [
      input.recordingId,
    ]);
    return { sessionId: rows[0]!.id };
  }

  async putChunk(
    userId: string,
    sessionId: string,
    seq: number,
    body: Buffer,
    declaredSha256: string,
    isLast: boolean,
  ): Promise<{ stored: true }> {
    if (body.length === 0) throw new BadRequestException("Empty chunk body");
    const session = await this.loadOpenSession(userId, sessionId);

    if (!verifyChunkChecksum(body, declaredSha256)) {
      // Corrupted in transit — the client must retry this seq.
      throw new ConflictException(`Checksum mismatch for chunk ${seq}`);
    }

    const existing = await this.db.query<{ sha256: string }>(
      "SELECT sha256 FROM upload_chunks WHERE session_id = $1 AND seq = $2",
      [sessionId, seq],
    );
    if (existing.rowCount > 0) {
      // Idempotent retry: same digest is fine, different digest is a client bug.
      if (existing.rows[0]!.sha256 !== declaredSha256.toLowerCase()) {
        throw new ConflictException(`Chunk ${seq} already uploaded with different content`);
      }
      return { stored: true };
    }

    const storageKey = `uploads/${sessionId}/${String(seq).padStart(6, "0")}`;
    await this.storage.putObject(storageKey, body, "application/octet-stream");
    await this.db.query(
      `INSERT INTO upload_chunks (session_id, seq, size_bytes, sha256, storage_key)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (session_id, seq) DO NOTHING`,
      [sessionId, seq, body.length, declaredSha256.toLowerCase(), storageKey],
    );
    if (isLast && session.total_chunks === null) {
      await this.db.query("UPDATE upload_sessions SET total_chunks = $1, updated_at = now() WHERE id = $2", [
        seq + 1,
        sessionId,
      ]);
    }
    return { stored: true };
  }

  /**
   * Assemble uploaded chunks into the final audio object and queue
   * transcription. With missing chunks: 409 + the exact seq list, so clients
   * re-send only what's absent. With an unknown total (client crashed), the
   * contiguous prefix is salvaged — partial audio is never silently dropped.
   */
  async complete(userId: string, sessionId: string): Promise<{ recordingId: string; salvagedChunks?: number }> {
    const session = await this.loadOpenSession(userId, sessionId);
    const { rows: chunks } = await this.db.query<{ seq: number; sha256: string; storage_key: string }>(
      "SELECT seq, sha256, storage_key FROM upload_chunks WHERE session_id = $1 ORDER BY seq",
      [sessionId],
    );

    const plan = planAssembly(chunks, session.total_chunks);
    if (!plan.ok) {
      throw new ConflictException({ message: plan.reason, missingChunks: plan.missing });
    }

    await this.db.query("UPDATE upload_sessions SET status = 'assembling', updated_at = now() WHERE id = $1", [
      sessionId,
    ]);

    const keyBySeq = new Map(chunks.map((c) => [c.seq, c.storage_key]));
    const sourceKeys = plan.orderedSeqs.map((s) => requireChunkKey(keyBySeq, s));
    const destKey = `audio/${session.recording_id}/original`;
    const totalBytes = await this.storage.concatObjects(sourceKeys, destKey, session.mime_type);

    await this.db.query(
      `UPDATE recordings SET status = 'uploaded', audio_original_key = $1, size_bytes = $2,
        original_mime = $3, version = version + 1 WHERE id = $4`,
      [destKey, totalBytes, session.mime_type, session.recording_id],
    );
    await this.db.query("UPDATE upload_sessions SET status = 'complete', updated_at = now() WHERE id = $1", [
      sessionId,
    ]);

    await this.queue.enqueue(session.recording_id);

    const salvaged = session.total_chunks === null ? plan.orderedSeqs.length : undefined;
    return { recordingId: session.recording_id, ...(salvaged !== undefined ? { salvagedChunks: salvaged } : {}) };
  }

  private async loadOpenSession(userId: string, sessionId: string) {
    const { rows } = await this.db.query<{
      id: string;
      recording_id: string;
      mime_type: string;
      total_chunks: number | null;
      status: string;
    }>(
      "SELECT id, recording_id, mime_type, total_chunks, status FROM upload_sessions WHERE id = $1 AND user_id = $2",
      [sessionId, userId],
    );
    const session = rows[0];
    if (!session) throw new NotFoundException("Upload session not found");
    if (session.status !== "open" && session.status !== "assembling") {
      throw new ConflictException(`Upload session is ${session.status}`);
    }
    return session;
  }
}

function requireChunkKey(map: Map<number, string>, seq: number): string {
  const key = map.get(seq);
  if (!key) throw new Error(`assembly plan referenced missing chunk ${seq}`);
  return key;
}
