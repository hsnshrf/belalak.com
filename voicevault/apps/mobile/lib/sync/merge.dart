/// Offline-first sync merge: last-write-wins with tombstones.
/// Dart mirror of packages/shared/src/sync.ts — keep both in sync.
library;

class SyncableRow {
  const SyncableRow({
    required this.id,
    required this.updatedAt,
    required this.version,
    this.deletedAt,
  });

  final String id;
  final DateTime updatedAt;
  final int version;
  final DateTime? deletedAt;
}

enum MergeDecision { local, remote, equal }

/// Rules, in order:
///  1. Newer `updatedAt` wins (last write wins).
///  2. Same timestamp: higher `version` wins.
///  3. Same timestamp and version: a tombstone beats a live row.
///  4. Otherwise equal (no write needed).
MergeDecision resolveConflict(SyncableRow local, SyncableRow remote) {
  if (local.id != remote.id) {
    throw ArgumentError('resolveConflict called with different rows: ${local.id} vs ${remote.id}');
  }
  final lt = local.updatedAt.millisecondsSinceEpoch;
  final rt = remote.updatedAt.millisecondsSinceEpoch;
  if (lt != rt) return lt > rt ? MergeDecision.local : MergeDecision.remote;
  if (local.version != remote.version) {
    return local.version > remote.version ? MergeDecision.local : MergeDecision.remote;
  }
  final localDead = local.deletedAt != null;
  final remoteDead = remote.deletedAt != null;
  if (localDead != remoteDead) {
    return localDead ? MergeDecision.local : MergeDecision.remote;
  }
  return MergeDecision.equal;
}

class MergeResult<T extends SyncableRow> {
  final List<T> toApply = [];
  final List<T> rejected = [];
  final List<T> unchanged = [];
}

/// Merge incoming rows against `current` (id → receiver's copy). Unknown ids
/// are always applied — including tombstones, so deletes reach devices that
/// never saw the row.
MergeResult<T> mergeRecords<T extends SyncableRow>(
  List<T> incoming,
  Map<String, SyncableRow> current,
) {
  final result = MergeResult<T>();
  for (final row in incoming) {
    final existing = current[row.id];
    if (existing == null) {
      result.toApply.add(row);
      continue;
    }
    switch (resolveConflict(row, existing)) {
      case MergeDecision.local:
        result.toApply.add(row);
      case MergeDecision.remote:
        result.rejected.add(row);
      case MergeDecision.equal:
        result.unchanged.add(row);
    }
  }
  return result;
}
