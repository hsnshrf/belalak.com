/// Wire/domain models — mirrors packages/shared/src/schemas.ts.
library;

class Word {
  const Word({required this.text, required this.start, required this.end});

  final String text;
  final double start;
  final double end;

  factory Word.fromJson(Map<String, dynamic> json) => Word(
        text: json['w'] as String,
        start: (json['s'] as num).toDouble(),
        end: (json['e'] as num).toDouble(),
      );

  Map<String, dynamic> toJson() => {'w': text, 's': start, 'e': end};
}

class TranscriptSegment {
  const TranscriptSegment({
    required this.id,
    required this.start,
    required this.end,
    required this.text,
    required this.words,
    this.speaker,
    this.language,
  });

  final String id;
  final double start;
  final double end;
  final String? speaker;
  final String? language;
  final String text;
  final List<Word> words;

  factory TranscriptSegment.fromJson(Map<String, dynamic> json) => TranscriptSegment(
        id: json['id'] as String,
        start: (json['start'] as num).toDouble(),
        end: (json['end'] as num).toDouble(),
        speaker: json['speaker'] as String?,
        language: json['language'] as String?,
        text: json['text'] as String,
        words: (json['words'] as List<dynamic>? ?? const [])
            .map((w) => Word.fromJson(w as Map<String, dynamic>))
            .toList(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'start': start,
        'end': end,
        'speaker': speaker,
        'language': language,
        'text': text,
        'words': words.map((w) => w.toJson()).toList(),
      };
}

class RecordingSummary {
  const RecordingSummary({
    required this.id,
    required this.title,
    required this.sourceType,
    required this.recordedAt,
    required this.consentAcknowledged,
    this.durationSeconds,
    this.language,
    this.transcriptionStatus,
    this.isFavorite = false,
  });

  final String id;
  final String title;
  final String sourceType;
  final DateTime recordedAt;
  final bool consentAcknowledged;
  final double? durationSeconds;
  final String? language;
  final String? transcriptionStatus;
  final bool isFavorite;

  factory RecordingSummary.fromJson(Map<String, dynamic> json) => RecordingSummary(
        id: json['id'] as String,
        title: json['title'] as String,
        sourceType: json['sourceType'] as String,
        recordedAt: DateTime.parse(json['recordedAt'] as String),
        consentAcknowledged: json['consentAcknowledged'] as bool? ?? false,
        durationSeconds: (json['durationSeconds'] as num?)?.toDouble(),
        language: json['languageDominant'] as String?,
        transcriptionStatus: json['transcriptionStatus'] as String?,
        isFavorite: json['isFavorite'] as bool? ?? false,
      );
}
