/**
 * Offline-first sync: last-write-wins with tombstones.
 *
 * Every syncable row carries:
 *   - `updatedAt`   wall-clock of the writing device (ISO 8601)
 *   - `version`     per-row counter, incremented on every local write; breaks
 *                   ties when two writes share a millisecond timestamp
 *   - `deletedAt`   tombstone — a deleted row is kept (soft) and still syncs,
 *                   so a delete on one device wins over a stale edit on another
 *
 * The server applies `mergeRecords` on push; mobile applies the same logic on
 * pull (mirrored in apps/mobile/lib/sync/merge.dart). Keep both in sync.
 */

export interface SyncableRow {
  id: string;
  updatedAt: string; // ISO 8601
  version: number;
  deletedAt: string | null;
}

export type MergeDecision = "local" | "remote" | "equal";

/**
 * Decide which of two versions of the same row wins.
 * Rules, in order:
 *  1. Newer `updatedAt` wins (last write wins).
 *  2. Same timestamp: higher `version` wins.
 *  3. Same timestamp and version: a tombstone beats a live row (deletes are
 *     the safer outcome to converge on — the trash keeps the data 30 days).
 *  4. Fully identical metadata → "equal" (no write needed).
 */
export function resolveConflict(local: SyncableRow, remote: SyncableRow): MergeDecision {
  if (local.id !== remote.id) {
    throw new Error(`resolveConflict called with different rows: ${local.id} vs ${remote.id}`);
  }
  const lt = Date.parse(local.updatedAt);
  const rt = Date.parse(remote.updatedAt);
  if (Number.isNaN(lt) || Number.isNaN(rt)) {
    throw new Error(`resolveConflict: invalid updatedAt on row ${local.id}`);
  }
  if (lt !== rt) return lt > rt ? "local" : "remote";
  if (local.version !== remote.version) {
    return local.version > remote.version ? "local" : "remote";
  }
  const localDead = local.deletedAt !== null;
  const remoteDead = remote.deletedAt !== null;
  if (localDead !== remoteDead) return localDead ? "local" : "remote";
  return "equal";
}

export interface MergeResult<T extends SyncableRow> {
  /** Rows the receiving side must upsert (winner was the incoming row). */
  toApply: T[];
  /** Incoming rows that lost — the receiving side's copy is newer. */
  rejected: T[];
  /** Incoming rows identical to what the receiver already has. */
  unchanged: T[];
}

/**
 * Merge a batch of incoming rows against the receiver's current rows.
 * `current` maps row id → receiver's copy; ids absent from `current` are new
 * and always applied (including incoming tombstones, so deletes propagate to
 * devices that never saw the row).
 */
export function mergeRecords<T extends SyncableRow>(
  incoming: T[],
  current: ReadonlyMap<string, SyncableRow>,
): MergeResult<T> {
  const result: MergeResult<T> = { toApply: [], rejected: [], unchanged: [] };
  for (const row of incoming) {
    const existing = current.get(row.id);
    if (!existing) {
      result.toApply.push(row);
      continue;
    }
    switch (resolveConflict(row, existing)) {
      case "local":
        result.toApply.push(row);
        break;
      case "remote":
        result.rejected.push(row);
        break;
      case "equal":
        result.unchanged.push(row);
        break;
    }
  }
  return result;
}
