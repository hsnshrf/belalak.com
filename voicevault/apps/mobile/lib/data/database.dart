import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import '../core/models.dart';

part 'database.g.dart';

/// Local offline-first store. Tables and queries live in tables.drift.
/// Regenerate bindings after schema changes:
///   dart run build_runner build --delete-conflicting-outputs
@DriftDatabase(include: {'tables.drift'})
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'voicevault'));

  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 1;

  /// Upsert a transcript and refresh its FTS row (offline search index).
  Future<void> saveTranscript({
    required String recordingId,
    required String title,
    required String text,
    required String? language,
    required String segmentsJson,
  }) async {
    await transaction(() async {
      await customStatement(
        'INSERT INTO local_transcripts (recording_id, kind, text, language, segments_json, updated_at) '
        'VALUES (?, \'original\', ?, ?, ?, ?) '
        'ON CONFLICT (recording_id) DO UPDATE SET text = excluded.text, '
        'language = excluded.language, segments_json = excluded.segments_json, '
        'updated_at = excluded.updated_at',
        [recordingId, text, language, segmentsJson, DateTime.now().toUtc().toIso8601String()],
      );
      await customStatement('DELETE FROM transcript_fts WHERE recording_id = ?', [recordingId]);
      await customStatement(
        'INSERT INTO transcript_fts (recording_id, title, body) VALUES (?, ?, ?)',
        [recordingId, title, text],
      );
    });
  }

  Future<List<TranscriptSegment>> segmentsFor(String recordingId) async {
    final rows = await customSelect(
      'SELECT segments_json FROM local_transcripts WHERE recording_id = ?',
      variables: [Variable.withString(recordingId)],
    ).get();
    if (rows.isEmpty) return const [];
    return decodeSegments(rows.first.read<String>('segments_json'));
  }
}

List<TranscriptSegment> decodeSegments(String json) {
  final list = jsonDecode(json) as List<dynamic>;
  return list.map((s) => TranscriptSegment.fromJson(s as Map<String, dynamic>)).toList();
}
