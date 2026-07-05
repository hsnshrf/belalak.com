import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { CreateRecordingInput } from "@voicevault/shared";
import { TRASH_RETENTION_DAYS } from "@voicevault/shared";
import type { Db } from "../db/db.service";
import { DbService } from "../db/db.service";
import { StorageService } from "../storage/storage.service";

export interface UpdateRecordingPatch {
  title?: string;
  folderId?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
  isFavorite?: boolean;
  archived?: boolean;
}

export type LibraryView = "all" | "favorites" | "archived" | "trash";

const RECORDING_COLUMNS = `
  id, user_id AS "userId", title, folder_id AS "folderId", category_id AS "categoryId",
  source_type AS "sourceType", capture_strategy AS "captureStrategy", status,
  quality_preset AS "qualityPreset", duration_seconds::float AS "durationSeconds",
  size_bytes::bigint AS "sizeBytes", language_dominant AS "languageDominant",
  consent_acknowledged AS "consentAcknowledged", consent_acknowledged_at AS "consentAcknowledgedAt",
  announcement_played AS "announcementPlayed", is_favorite AS "isFavorite",
  archived_at AS "archivedAt", trashed_at AS "trashedAt", recorded_at AS "recordedAt",
  created_at AS "createdAt", updated_at AS "updatedAt", version`;

@Injectable()
export class RecordingsService {
  constructor(
    private readonly db: DbService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Create a recording row. Idempotent on (user, clientId): an offline client
   * that retries after a lost response gets the same row back, never a
   * duplicate. The consent acknowledgment is persisted atomically with the
   * recording itself — a recording can never exist without its consent state.
   */
  async create(userId: string, input: CreateRecordingInput, db: Db = this.db) {
    const title = input.title?.trim() || defaultTitle(new Date(input.recordedAt));
    const { rows } = await db.query(
      `INSERT INTO recordings (
         user_id, client_id, title, folder_id, category_id, source_type,
         capture_strategy, quality_preset, recorded_at,
         consent_acknowledged, consent_acknowledged_at, announcement_played
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                 CASE WHEN $10 THEN now() ELSE NULL END, $11)
       ON CONFLICT (user_id, client_id) WHERE client_id IS NOT NULL
       DO UPDATE SET updated_at = recordings.updated_at
       RETURNING ${RECORDING_COLUMNS}`,
      [
        userId,
        input.clientId,
        title,
        input.folderId ?? null,
        input.categoryId ?? null,
        input.sourceType,
        input.captureStrategy,
        input.qualityPreset,
        input.recordedAt,
        input.consentAcknowledged,
        input.announcementPlayed,
      ],
    );
    return rows[0]!;
  }

  async list(userId: string, opts: { view: LibraryView; folderId?: string; categoryId?: string; limit: number; offset: number }) {
    const conds = ["user_id = $1", "deleted_at IS NULL"];
    const params: unknown[] = [userId];
    switch (opts.view) {
      case "trash":
        conds.push("trashed_at IS NOT NULL");
        break;
      case "archived":
        conds.push("trashed_at IS NULL", "archived_at IS NOT NULL");
        break;
      case "favorites":
        conds.push("trashed_at IS NULL", "archived_at IS NULL", "is_favorite");
        break;
      default:
        conds.push("trashed_at IS NULL", "archived_at IS NULL");
    }
    if (opts.folderId) {
      params.push(opts.folderId);
      conds.push(`folder_id = $${params.length}`);
    }
    if (opts.categoryId) {
      params.push(opts.categoryId);
      conds.push(`category_id = $${params.length}`);
    }
    params.push(opts.limit, opts.offset);
    const { rows } = await this.db.query(
      `SELECT ${RECORDING_COLUMNS},
         coalesce((SELECT json_agg(tag_id) FROM recording_tags rt WHERE rt.recording_id = recordings.id), '[]') AS "tagIds",
         (SELECT tj.status FROM transcript_jobs tj WHERE tj.recording_id = recordings.id
            ORDER BY tj.queued_at DESC LIMIT 1) AS "transcriptionStatus",
         count(*) OVER() AS total
       FROM recordings WHERE ${conds.join(" AND ")}
       ORDER BY recorded_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    const total = rows.length > 0 ? Number((rows[0] as { total: string }).total) : 0;
    return { items: rows.map(({ total: _t, ...r }) => r), total };
  }

  async getDetail(userId: string, id: string) {
    const rec = await this.requireOwned(userId, id);
    const [transcripts, speakers] = await Promise.all([
      this.db.query(
        `SELECT id, recording_id AS "recordingId", kind, text, language, segments, provider,
                created_at AS "createdAt", updated_at AS "updatedAt"
         FROM transcripts WHERE recording_id = $1 AND deleted_at IS NULL`,
        [id],
      ),
      this.db.query(
        `SELECT id, label, display_name AS "displayName" FROM speakers WHERE recording_id = $1 ORDER BY label`,
        [id],
      ),
    ]);
    // Prefer the edited transcript when the user has made corrections.
    const transcript =
      transcripts.rows.find((t) => (t as { kind: string }).kind === "edited") ?? transcripts.rows[0] ?? null;
    const audioKey = (rec as { audio_original_key?: string }).audio_original_key;
    const audioUrl = audioKey ? await this.storage.signedGetUrl(audioKey) : null;
    return { ...rec, transcript, speakers: speakers.rows, audioUrl };
  }

  /**
   * Metadata updates. Consent fields are deliberately NOT updatable: the
   * acknowledgment recorded at capture time is an immutable audit fact.
   */
  async update(userId: string, id: string, patch: UpdateRecordingPatch, db?: Db) {
    const runner = db ?? this.db;
    await this.requireOwned(userId, id, runner);
    const sets: string[] = ["version = version + 1"];
    const params: unknown[] = [id];
    const set = (expr: string, value: unknown) => {
      params.push(value);
      sets.push(expr.replace("?", `$${params.length}`));
    };
    if (patch.title !== undefined) {
      if (!patch.title.trim()) throw new BadRequestException("Title cannot be empty");
      set("title = ?", patch.title.trim());
    }
    if (patch.folderId !== undefined) set("folder_id = ?", patch.folderId);
    if (patch.categoryId !== undefined) set("category_id = ?", patch.categoryId);
    if (patch.isFavorite !== undefined) set("is_favorite = ?", patch.isFavorite);
    if (patch.archived !== undefined) {
      sets.push(patch.archived ? "archived_at = coalesce(archived_at, now())" : "archived_at = NULL");
    }
    const { rows } = await runner.query(
      `UPDATE recordings SET ${sets.join(", ")} WHERE id = $1 RETURNING ${RECORDING_COLUMNS}`,
      params,
    );
    if (patch.tagIds !== undefined) {
      await runner.query("DELETE FROM recording_tags WHERE recording_id = $1", [id]);
      for (const tagId of new Set(patch.tagIds)) {
        await runner.query(
          "INSERT INTO recording_tags (recording_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [id, tagId],
        );
      }
      await runner.query("UPDATE recordings SET version = version + 1 WHERE id = $1", [id]);
    }
    return rows[0]!;
  }

  /** Soft delete → trash with 30-day retention before permanent purge. */
  async trash(userId: string, id: string): Promise<void> {
    await this.requireOwned(userId, id);
    await this.db.query(
      `UPDATE recordings SET trashed_at = now(),
         purge_after = now() + interval '${TRASH_RETENTION_DAYS} days',
         version = version + 1
       WHERE id = $1 AND trashed_at IS NULL`,
      [id],
    );
  }

  async restore(userId: string, id: string) {
    await this.requireOwned(userId, id);
    const { rows } = await this.db.query(
      `UPDATE recordings SET trashed_at = NULL, purge_after = NULL, version = version + 1
       WHERE id = $1 RETURNING ${RECORDING_COLUMNS}`,
      [id],
    );
    return rows[0]!;
  }

  /** Permanent, irreversible delete. Controller enforces confirm=true. */
  async purge(userId: string, id: string): Promise<void> {
    const rec = await this.requireOwned(userId, id);
    const keys = [
      (rec as { audio_original_key?: string }).audio_original_key,
      (rec as { audio_compressed_key?: string }).audio_compressed_key,
    ].filter((k): k is string => !!k);
    for (const key of keys) {
      await this.storage.deleteObject(key);
    }
    // Tombstone (not row removal) so offline devices learn about the delete.
    await this.db.query(
      "UPDATE recordings SET deleted_at = now(), title = '', audio_original_key = NULL, audio_compressed_key = NULL, version = version + 1 WHERE id = $1",
      [id],
    );
    await this.db.query("DELETE FROM transcripts WHERE recording_id = $1", [id]);
    await this.db.query("DELETE FROM ai_artifacts WHERE recording_id = $1", [id]);
  }

  /** Called by the scheduled purge job: permanently delete expired trash. */
  async purgeExpiredTrash(): Promise<number> {
    const { rows } = await this.db.query<{ id: string; user_id: string }>(
      "SELECT id, user_id FROM recordings WHERE trashed_at IS NOT NULL AND purge_after < now() AND deleted_at IS NULL",
    );
    for (const row of rows) {
      await this.purge(row.user_id, row.id);
    }
    return rows.length;
  }

  private async requireOwned(userId: string, id: string, db: Db = this.db) {
    const { rows } = await db.query(
      `SELECT ${RECORDING_COLUMNS}, audio_original_key, audio_compressed_key
       FROM recordings WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId],
    );
    if (!rows[0]) throw new NotFoundException("Recording not found");
    return rows[0];
  }
}

/** Default name = date + time; the transcription worker appends the first topic. */
export function defaultTitle(recordedAt: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${recordedAt.getFullYear()}-${pad(recordedAt.getMonth() + 1)}-${pad(recordedAt.getDate())} ${pad(recordedAt.getHours())}:${pad(recordedAt.getMinutes())}`;
}
