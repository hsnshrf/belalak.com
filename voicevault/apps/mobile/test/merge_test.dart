import 'package:flutter_test/flutter_test.dart';
import 'package:voicevault/sync/merge.dart';

SyncableRow row({
  String id = 'r1',
  String updatedAt = '2026-07-04T10:00:00.000Z',
  int version = 1,
  String? deletedAt,
}) =>
    SyncableRow(
      id: id,
      updatedAt: DateTime.parse(updatedAt),
      version: version,
      deletedAt: deletedAt == null ? null : DateTime.parse(deletedAt),
    );

void main() {
  group('resolveConflict (last-write-wins with tombstones)', () {
    test('newer updatedAt wins regardless of version', () {
      final newer = row(updatedAt: '2026-07-04T10:00:01.000Z', version: 1);
      final older = row(updatedAt: '2026-07-04T10:00:00.000Z', version: 99);
      expect(resolveConflict(newer, older), MergeDecision.local);
      expect(resolveConflict(older, newer), MergeDecision.remote);
    });

    test('same timestamp: higher version wins', () {
      expect(resolveConflict(row(version: 3), row(version: 2)), MergeDecision.local);
      expect(resolveConflict(row(version: 2), row(version: 3)), MergeDecision.remote);
    });

    test('same timestamp and version: tombstone wins', () {
      final dead = row(deletedAt: '2026-07-04T10:00:00.000Z');
      expect(resolveConflict(dead, row()), MergeDecision.local);
      expect(resolveConflict(row(), dead), MergeDecision.remote);
    });

    test('identical rows are equal', () {
      expect(resolveConflict(row(), row()), MergeDecision.equal);
    });

    test('a later delete beats a stale edit (offline device scenario)', () {
      final staleEdit = row(updatedAt: '2026-07-04T09:59:00.000Z', version: 5);
      final laterDelete = row(
        updatedAt: '2026-07-04T10:01:00.000Z',
        version: 2,
        deletedAt: '2026-07-04T10:01:00.000Z',
      );
      expect(resolveConflict(laterDelete, staleEdit), MergeDecision.local);
    });

    test('mismatched ids throw', () {
      expect(() => resolveConflict(row(), row(id: 'other')), throwsArgumentError);
    });
  });

  group('mergeRecords', () {
    test('applies unknown rows including tombstones for never-seen rows', () {
      final tombstone = row(id: 'never-seen', deletedAt: '2026-07-04T10:00:00.000Z');
      final res = mergeRecords([tombstone], {});
      expect(res.toApply, [tombstone]);
      expect(res.rejected, isEmpty);
    });

    test('partitions a mixed batch into apply/reject/unchanged', () {
      final current = <String, SyncableRow>{
        'a': row(id: 'a', updatedAt: '2026-07-04T10:00:00.000Z'),
        'b': row(id: 'b', updatedAt: '2026-07-04T12:00:00.000Z'),
        'c': row(id: 'c'),
      };
      final incoming = [
        row(id: 'a', updatedAt: '2026-07-04T11:00:00.000Z'), // newer → apply
        row(id: 'b', updatedAt: '2026-07-04T11:00:00.000Z'), // older → reject
        row(id: 'c'), // identical → unchanged
        row(id: 'd'), // new → apply
      ];
      final res = mergeRecords(incoming, current);
      expect(res.toApply.map((r) => r.id), ['a', 'd']);
      expect(res.rejected.map((r) => r.id), ['b']);
      expect(res.unchanged.map((r) => r.id), ['c']);
    });
  });
}
