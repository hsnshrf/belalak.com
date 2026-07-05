import { BadRequestException, Injectable } from "@nestjs/common";
import { mergeRecords, type SyncableRow } from "@voicevault/shared";
import { DbService } from "../db/db.service";

/**
 * Offline-first sync for mobile. Push applies client changes through the
 * shared last-write-wins merge (packages/shared/src/sync.ts — same logic the
 * mobile client mirrors); pull streams rows whose sync_seq moved past the
 * device's cursor, tombstones included.
 *
 * Audio bytes do NOT travel through here — they go through the chunked upload
 * endpoints; sync covers metadata (recordings, folders, tags).
 */

export interface SyncRowDto extends SyncableRow {
  entity: "recording" | "folder" | "tag";
  payload: Record<string, unknown>;
}

const ENTITY_TABLE: Record<SyncRowDto["entity"], string> = {
  recording: "recordings",
  folder: "folders",
  tag: "tags",
};

/** Columns a client may write per entity — everything else is server-owned. */
const WRITABLE: Record<SyncRowDto["entity"], string[]> = {
  recording: [
    "title", "folder_id", "category_id", "is_favorite", "archived_at", "trashed_at",
    "source_type", "capture_strategy", "quality_preset", "recorded_at",
    "consent_acknowledged", "consent_acknowledged_at", "announcement_played",
    "duration_seconds", "client_id",
  ],
  folder: ["name", "parent_id"],
  tag: ["name"],
};

@Injectable()
export class SyncService {
  constructor(private readonly db: DbService) {}

  async push(userId: string, deviceId: string, rows: SyncRowDto[]) {
    await this.db.query(
      `INSERT INTO devices (id, user_id, last_seen_at) VALUES ($1, $2, now())
       ON CONFLICT (id) DO UPDATE SET last_seen_at = now()`,
      [deviceId, userId],
    );

    const applied: string[] = [];
    const rejected: { id: string; serverRow: SyncRowDto }[] = [];

    for (const entity of ["folder", "tag", "recording"] as const) {
      const batch = rows.filter((r) => r.entity === entity);
      if (batch.length === 0) continue;
      const table = ENTITY_TABLE[entity];

      const ids = batch.map((r) => r.id);
      const { rows: existing } = await this.db.query<{
        id: string;
        updated_at: Date;
        version: string;
        deleted_at: Date | null;
      }>(`SELECT id, updated_at, version, deleted_at FROM ${table} WHERE user_id = $1 AND id = ANY($2)`, [
        userId,
        ids,
      ]);
      const current = new Map<string, SyncableRow>(
        existing.map((e) => [
          e.id,
          {
            id: e.id,
            updatedAt: e.updated_at.toISOString(),
            version: Number(e.version),
            deletedAt: e.deleted_at ? e.deleted_at.toISOString() : null,
          },
        ]),
      );

      const merged = mergeRecords(batch, current);
      for (const row of merged.toApply) {
        await this.upsert(userId, entity, row);
        applied.push(row.id);
      }
      for (const row of merged.rejected) {
        const server = await this.loadServerRow(userId, entity, row.id);
        if (server) rejected.push({ id: row.id, serverRow: server });
      }
      applied.push(...merged.unchanged.map((r) => r.id));
    }
    return { applied, rejected };
  }

  async pull(userId: string, deviceId: string, since: number) {
    const out: SyncRowDto[] = [];
    let cursor = since;
    for (const entity of ["folder", "tag", "recording"] as const) {
      const table = ENTITY_TABLE[entity];
      const { rows } = await this.db.query<Record<string, unknown>>(
        `SELECT * FROM ${table} WHERE user_id = $1 AND sync_seq > $2 ORDER BY sync_seq LIMIT 500`,
        [userId, since],
      );
      for (const raw of rows) {
        out.push(this.toDto(entity, raw));
        cursor = Math.max(cursor, Number(raw.sync_seq));
      }
    }
    await this.db.query(
      `INSERT INTO devices (id, user_id, last_pull_seq, last_seen_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (id) DO UPDATE SET last_pull_seq = $3, last_seen_at = now()`,
      [deviceId, userId, cursor],
    );
    return { rows: out, cursor };
  }

  private async upsert(userId: string, entity: SyncRowDto["entity"], row: SyncRowDto): Promise<void> {
    const table = ENTITY_TABLE[entity];
    const writable = WRITABLE[entity];
    const cols: string[] = ["id", "user_id", "version", "updated_at", "deleted_at"];
    const values: unknown[] = [row.id, userId, row.version, row.updatedAt, row.deletedAt];
    for (const [key, value] of Object.entries(row.payload ?? {})) {
      const col = camelToSnake(key);
      if (!writable.includes(col)) continue; // ignore server-owned/unknown fields
      cols.push(col);
      values.push(value);
    }
    if (entity === "recording" && !cols.includes("recorded_at")) {
      throw new BadRequestException(`recording ${row.id}: payload.recordedAt is required`);
    }
    if (entity === "recording" && !cols.includes("source_type")) {
      cols.push("source_type");
      values.push("mic");
    }
    if (entity === "recording" && !cols.includes("title")) {
      cols.push("title");
      values.push("Untitled");
    }
    if ((entity === "folder" || entity === "tag") && !cols.includes("name")) {
      throw new BadRequestException(`${entity} ${row.id}: payload.name is required`);
    }
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const updates = cols
      .filter((c) => c !== "id" && c !== "user_id")
      .map((c) => `${c} = EXCLUDED.${c}`);
    await this.db.query(
      `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders.join(", ")})
       ON CONFLICT (id) DO UPDATE SET ${updates.join(", ")}
       WHERE ${table}.user_id = $2`,
      values,
    );
  }

  private async loadServerRow(userId: string, entity: SyncRowDto["entity"], id: string): Promise<SyncRowDto | null> {
    const table = ENTITY_TABLE[entity];
    const { rows } = await this.db.query<Record<string, unknown>>(
      `SELECT * FROM ${table} WHERE user_id = $1 AND id = $2`,
      [userId, id],
    );
    return rows[0] ? this.toDto(entity, rows[0]) : null;
  }

  private toDto(entity: SyncRowDto["entity"], raw: Record<string, unknown>): SyncRowDto {
    const writable = WRITABLE[entity];
    const payload: Record<string, unknown> = {};
    for (const col of writable) {
      if (col in raw) payload[snakeToCamel(col)] = raw[col];
    }
    return {
      id: String(raw.id),
      entity,
      updatedAt: (raw.updated_at as Date).toISOString(),
      version: Number(raw.version),
      deletedAt: raw.deleted_at ? (raw.deleted_at as Date).toISOString() : null,
      payload,
    };
  }
}

const camelToSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const snakeToCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
