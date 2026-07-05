/// Offline search hit → audio timestamp mapping.
/// Dart mirror of apps/api/src/search/match-locator.ts (SQLite FTS5 finds
/// WHICH local transcripts match; this finds WHERE in the audio).
library;

import '../core/models.dart';

String normalizeToken(String raw) {
  var s = raw.toLowerCase();
  s = s.replaceAll('ـ', ''); // Arabic tatweel
  // Combining marks (Arabic harakat, Hebrew niqqud, etc.)
  s = s.replaceAll(RegExp(r'\p{M}', unicode: true), '');
  // Edge punctuation/symbols
  s = s.replaceAll(RegExp(r'^[\p{P}\p{S}]+|[\p{P}\p{S}]+$', unicode: true), '');
  return s;
}

class LocatedMatch {
  const LocatedMatch({required this.timeSeconds, required this.segmentId, required this.snippet});

  final double? timeSeconds;
  final String? segmentId;

  /// Plain-text snippet; the matched words are wrapped in «guillemets» for
  /// highlighting in Flutter text spans.
  final String snippet;
}

List<LocatedMatch> locateMatches(
  List<TranscriptSegment> segments,
  String query, {
  int contextWords = 6,
  int maxMatches = 10,
}) {
  final terms = query.split(RegExp(r'\s+')).map(normalizeToken).where((t) => t.isNotEmpty).toList();
  if (terms.isEmpty) return const [];

  final matches = <LocatedMatch>[];
  for (final segment in segments) {
    final norm = segment.words.map((w) => normalizeToken(w.text)).toList();
    for (var i = 0; i + terms.length <= norm.length; i++) {
      var hit = true;
      for (var j = 0; j < terms.length; j++) {
        if (norm[i + j] != terms[j]) {
          hit = false;
          break;
        }
      }
      if (!hit) continue;

      final from = (i - contextWords).clamp(0, segment.words.length);
      final to = (i + terms.length + contextWords).clamp(0, segment.words.length);
      final parts = <String>[
        if (from > 0) '…',
        for (var k = from; k < to; k++)
          (k >= i && k < i + terms.length) ? '«${segment.words[k].text}»' : segment.words[k].text,
        if (to < segment.words.length) '…',
      ];
      matches.add(LocatedMatch(
        timeSeconds: segment.words[i].start,
        segmentId: segment.id,
        snippet: parts.join(' '),
      ));
      if (matches.length >= maxMatches) return matches;
      i += terms.length - 1;
    }
  }

  if (matches.isEmpty) {
    // Fallback for segments without word timing (e.g. hand-edited text).
    final needle = terms.join(' ');
    for (final segment in segments) {
      final normText =
          segment.text.split(RegExp(r'\s+')).map(normalizeToken).where((t) => t.isNotEmpty).join(' ');
      if (normText.contains(needle)) {
        matches.add(LocatedMatch(
          timeSeconds: segment.words.isNotEmpty ? segment.words.first.start : segment.start,
          segmentId: segment.id,
          snippet: segment.text.length <= 160 ? segment.text : '${segment.text.substring(0, 159)}…',
        ));
        if (matches.length >= maxMatches) break;
      }
    }
  }
  return matches;
}
