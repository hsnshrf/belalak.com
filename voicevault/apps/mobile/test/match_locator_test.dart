import 'package:flutter_test/flutter_test.dart';
import 'package:voicevault/core/models.dart';
import 'package:voicevault/search/match_locator.dart';

TranscriptSegment seg(String id, double startAt, String text) {
  final tokens = text.split(' ');
  return TranscriptSegment(
    id: id,
    start: startAt,
    end: startAt + tokens.length,
    text: text,
    words: [
      for (var i = 0; i < tokens.length; i++)
        Word(text: tokens[i], start: startAt + i, end: startAt + i + 0.9),
    ],
  );
}

void main() {
  final segments = [
    seg('s1', 0, 'Welcome everyone to the quarterly budget review meeting'),
    seg('s2', 100, 'The budget for marketing doubled, said Sara'),
    seg('s3', 200, 'لنتحدث عن الميزانية الجديدة اليوم'),
  ];

  group('offline search → audio timestamp', () {
    test('returns the start time of the matched word', () {
      final hits = locateMatches(segments, 'budget');
      expect(hits, hasLength(2));
      expect(hits[0].timeSeconds, 5);
      expect(hits[1].timeSeconds, 101);
    });

    test('matches case-insensitively through punctuation', () {
      final hits = locateMatches(segments, 'SARA');
      expect(hits, hasLength(1));
      expect(hits[0].timeSeconds, 106);
    });

    test('multi-word phrases must be consecutive', () {
      expect(locateMatches(segments, 'budget review'), hasLength(1));
      expect(locateMatches(segments, 'budget meeting'), isEmpty);
    });

    test('Arabic matches regardless of diacritics', () {
      final hits = locateMatches(segments, 'الميزانيَة');
      expect(hits, hasLength(1));
      expect(hits[0].segmentId, 's3');
      expect(hits[0].timeSeconds, 202);
    });

    test('snippet marks the matched word with guillemets', () {
      final hits = locateMatches(segments, 'budget');
      expect(hits[0].snippet, contains('«budget»'));
    });

    test('falls back to segment start when word timing is missing', () {
      const noWords = TranscriptSegment(
        id: 'edited',
        start: 42,
        end: 50,
        text: 'manually corrected budget line',
        words: [],
      );
      final hits = locateMatches(const [noWords], 'budget');
      expect(hits, hasLength(1));
      expect(hits[0].timeSeconds, 42);
    });
  });
}
