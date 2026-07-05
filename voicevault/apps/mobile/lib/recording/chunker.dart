/// Chunked-upload bookkeeping for mobile recordings.
///
/// The `record` package writes ONE continuous file per recording session.
/// Chunks are byte ranges of that file, cut every [uploadChunkSeconds] of
/// audio (or on demand), so server-side byte concatenation reproduces the
/// original file exactly. Ranges never overlap and never leave gaps.
library;

class ChunkRange {
  const ChunkRange({required this.seq, required this.start, required this.end});

  final int seq;

  /// Inclusive start byte offset.
  final int start;

  /// Exclusive end byte offset.
  final int end;

  int get length => end - start;

  @override
  String toString() => 'ChunkRange(#$seq $start..$end)';
}

/// Tracks how much of the growing recording file has been shipped and cuts
/// the next range when enough new bytes have accumulated (or at finalize).
class RollingChunker {
  RollingChunker({required this.minChunkBytes});

  /// Cut a chunk once at least this many new bytes exist. Derived from the
  /// bitrate: 5 minutes at 32 kbps ≈ 1.2 MB; callers compute it per preset.
  final int minChunkBytes;

  int _shippedBytes = 0;
  int _nextSeq = 0;

  int get shippedBytes => _shippedBytes;
  int get nextSeq => _nextSeq;

  /// Called periodically with the current file length. Returns the next range
  /// to upload, or null if not enough new audio has accumulated yet.
  ChunkRange? cut(int fileLengthBytes) {
    if (fileLengthBytes < _shippedBytes) {
      throw StateError('file shrank: $fileLengthBytes < shipped $_shippedBytes');
    }
    final pending = fileLengthBytes - _shippedBytes;
    if (pending < minChunkBytes) return null;
    return _take(fileLengthBytes);
  }

  /// Recording finished: flush whatever remains, even if small.
  /// Returns null when every byte has already been shipped.
  ChunkRange? finalize(int fileLengthBytes) {
    if (fileLengthBytes < _shippedBytes) {
      throw StateError('file shrank: $fileLengthBytes < shipped $_shippedBytes');
    }
    if (fileLengthBytes == _shippedBytes) return null;
    return _take(fileLengthBytes);
  }

  ChunkRange _take(int upTo) {
    final range = ChunkRange(seq: _nextSeq, start: _shippedBytes, end: upTo);
    _shippedBytes = upTo;
    _nextSeq += 1;
    return range;
  }

  /// Rebuild state from a persisted upload manifest after an app kill —
  /// interruption recovery resumes exactly where the last chunk ended.
  static RollingChunker resume({
    required int minChunkBytes,
    required List<ChunkRange> alreadyUploaded,
  }) {
    final chunker = RollingChunker(minChunkBytes: minChunkBytes);
    if (alreadyUploaded.isEmpty) return chunker;
    final sorted = [...alreadyUploaded]..sort((a, b) => a.seq.compareTo(b.seq));
    var expectedStart = 0;
    for (final c in sorted) {
      if (c.seq != sorted.indexOf(c) || c.start != expectedStart) {
        throw StateError('manifest is not contiguous at seq ${c.seq}');
      }
      expectedStart = c.end;
    }
    chunker._shippedBytes = sorted.last.end;
    chunker._nextSeq = sorted.last.seq + 1;
    return chunker;
  }
}

/// Bytes expected for [seconds] of audio at [bitrateKbps] (used to size chunks).
int bytesForSeconds({required int seconds, required int bitrateKbps}) =>
    (seconds * bitrateKbps * 1000) ~/ 8;
