import 'package:flutter_test/flutter_test.dart';
import 'package:voicevault/recording/chunker.dart';

void main() {
  group('RollingChunker (audio chunking/upload)', () {
    test('does not cut before enough audio has accumulated', () {
      final c = RollingChunker(minChunkBytes: 1000);
      expect(c.cut(999), isNull);
      expect(c.shippedBytes, 0);
    });

    test('cuts contiguous, non-overlapping ranges as the file grows', () {
      final c = RollingChunker(minChunkBytes: 1000);
      final r0 = c.cut(1200)!;
      expect((r0.seq, r0.start, r0.end), (0, 0, 1200));
      expect(c.cut(1900), isNull); // only 700 new bytes
      final r1 = c.cut(2400)!;
      expect((r1.seq, r1.start, r1.end), (1, 1200, 2400));
    });

    test('finalize flushes the small tail; nothing left → null', () {
      final c = RollingChunker(minChunkBytes: 1000);
      c.cut(1500);
      final tail = c.finalize(1700)!;
      expect((tail.seq, tail.start, tail.end), (1, 1500, 1700));
      expect(c.finalize(1700), isNull);
    });

    test('a shrinking file is a bug, not a silent data loss', () {
      final c = RollingChunker(minChunkBytes: 1000);
      c.cut(1500);
      expect(() => c.cut(100), throwsStateError);
    });

    test('resume() rebuilds state from a persisted manifest (recovery)', () {
      final resumed = RollingChunker.resume(
        minChunkBytes: 1000,
        alreadyUploaded: const [
          ChunkRange(seq: 0, start: 0, end: 1200),
          ChunkRange(seq: 1, start: 1200, end: 2400),
        ],
      );
      expect(resumed.shippedBytes, 2400);
      expect(resumed.nextSeq, 2);
      final next = resumed.finalize(3000)!;
      expect((next.seq, next.start, next.end), (2, 2400, 3000));
    });

    test('resume() rejects a gapped manifest', () {
      expect(
        () => RollingChunker.resume(
          minChunkBytes: 1000,
          alreadyUploaded: const [
            ChunkRange(seq: 0, start: 0, end: 1200),
            ChunkRange(seq: 2, start: 2400, end: 3000), // seq 1 missing
          ],
        ),
        throwsStateError,
      );
    });
  });

  test('bytesForSeconds sizes 5-minute chunks from the bitrate', () {
    // 5 min at 32 kbps = 300s * 32000/8 bytes = 1.2 MB
    expect(bytesForSeconds(seconds: 300, bitrateKbps: 32), 1200000);
    expect(bytesForSeconds(seconds: 300, bitrateKbps: 128), 4800000);
  });
}
