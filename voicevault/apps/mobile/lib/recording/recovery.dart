import 'dart:io';
import 'dart:typed_data';

import 'package:drift/drift.dart';

import '../api/api_client.dart';
import '../data/database.dart';

/// Interruption recovery — runs on every app launch.
///
/// Scenario: recording was cut short (incoming call, app kill, battery death).
/// The audio file is on disk and upload_manifest says which byte ranges made
/// it to the server. This re-ships the missing ranges plus the tail that was
/// never chunked, then completes the session — the server salvages the
/// contiguous prefix (see api uploads/chunk-assembler.ts).
class InterruptionRecovery {
  InterruptionRecovery({required this.api, required this.db});

  final ApiClient api;
  final AppDatabase db;

  /// Returns the ids of recordings whose upload was repaired.
  Future<List<String>> recoverPending() async {
    final rows = await db
        .customSelect(
          "SELECT id, local_audio_path FROM local_recordings "
          "WHERE upload_state IN ('pending', 'uploading', 'failed') "
          'AND local_audio_path IS NOT NULL AND deleted_at IS NULL',
        )
        .get();

    final recovered = <String>[];
    for (final row in rows) {
      final id = row.read<String>('id');
      final path = row.read<String>('local_audio_path');
      try {
        if (await _recoverOne(id, path)) recovered.add(id);
      } catch (_) {
        // Still offline or server unreachable — try again next launch/sync.
      }
    }
    return recovered;
  }

  Future<bool> _recoverOne(String recordingId, String path) async {
    final file = File(path);
    if (!file.existsSync() || file.lengthSync() == 0) return false;

    var sessionId = await _existingSession(recordingId);
    sessionId ??= await _openSession(recordingId, path);

    // Re-ship every manifest range not confirmed uploaded.
    final ranges = await db
        .customSelect(
          'SELECT seq, start_byte, end_byte, uploaded FROM upload_manifest '
          'WHERE recording_id = ? ORDER BY seq',
          variables: [Variable.withString(recordingId)],
        )
        .get();

    var shippedTo = 0;
    var lastSeq = -1;
    final raf = await file.open();
    try {
      for (final r in ranges) {
        final seq = r.read<int>('seq');
        final start = r.read<int>('start_byte');
        final end = r.read<int>('end_byte');
        lastSeq = seq;
        shippedTo = end;
        if (r.read<int>('uploaded') == 1) continue;
        await raf.setPosition(start);
        final bytes = await raf.read(end - start);
        await api.uploadChunk(sessionId: sessionId, seq: seq, bytes: Uint8List.fromList(bytes), isLast: false);
        await db.customStatement(
          'UPDATE upload_manifest SET uploaded = 1, session_id = ? WHERE recording_id = ? AND seq = ?',
          [sessionId, recordingId, seq],
        );
      }
      // The tail that was recorded after the last cut (or the whole file when
      // the app died before any chunk shipped).
      final total = file.lengthSync();
      if (total > shippedTo) {
        final seq = lastSeq + 1;
        await raf.setPosition(shippedTo);
        final bytes = await raf.read(total - shippedTo);
        await db.customStatement(
          'INSERT INTO upload_manifest (recording_id, session_id, seq, start_byte, end_byte, uploaded) '
          'VALUES (?, ?, ?, ?, ?, 0) ON CONFLICT (recording_id, seq) DO NOTHING',
          [recordingId, sessionId, seq, shippedTo, total],
        );
        await api.uploadChunk(sessionId: sessionId, seq: seq, bytes: Uint8List.fromList(bytes), isLast: true);
        await db.customStatement(
          'UPDATE upload_manifest SET uploaded = 1 WHERE recording_id = ? AND seq = ?',
          [recordingId, seq],
        );
      }
    } finally {
      await raf.close();
    }

    await api.request('POST', '/v1/uploads/sessions/$sessionId/complete');
    await db.customStatement(
      "UPDATE local_recordings SET upload_state = 'uploaded', dirty = 1, updated_at = ? WHERE id = ?",
      [DateTime.now().toUtc().toIso8601String(), recordingId],
    );
    return true;
  }

  Future<String?> _existingSession(String recordingId) async {
    final row = await db
        .customSelect(
          'SELECT session_id FROM upload_manifest WHERE recording_id = ? AND session_id IS NOT NULL LIMIT 1',
          variables: [Variable.withString(recordingId)],
        )
        .getSingleOrNull();
    return row?.readNullable<String>('session_id');
  }

  Future<String> _openSession(String recordingId, String path) async {
    final local = await db
        .customSelect('SELECT * FROM local_recordings WHERE id = ?',
            variables: [Variable.withString(recordingId)])
        .getSingle();
    final d = local.data;
    final rec = await api.request('POST', '/v1/recordings', jsonBody: {
      'clientId': recordingId,
      'sourceType': d['source_type'],
      'captureStrategy': d['capture_strategy'],
      'qualityPreset': d['quality_preset'],
      'recordedAt': d['recorded_at'],
      'consentAcknowledged': d['consent_acknowledged'] == 1,
      'announcementPlayed': d['announcement_played'] == 1,
    }) as Map<String, dynamic>;
    final session = await api.request('POST', '/v1/uploads/sessions', jsonBody: {
      'recordingId': rec['id'],
      'mimeType': path.endsWith('.m4a') ? 'audio/mp4' : 'audio/opus',
    }) as Map<String, dynamic>;
    return session['sessionId'] as String;
  }
}
