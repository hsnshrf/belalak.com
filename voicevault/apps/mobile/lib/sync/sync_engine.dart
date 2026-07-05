import 'dart:convert';

import 'package:drift/drift.dart';

import '../api/api_client.dart';
import '../data/database.dart';
import 'merge.dart';

/// Push local dirty rows / pull server changes. Metadata only — audio bytes
/// travel through the chunked upload path (ChunkUploader).
///
/// Conflict policy is the shared LWW+tombstone merge (merge.dart mirrors
/// packages/shared/src/sync.ts): the server merges on push; on pull we apply
/// the same rules locally so both sides converge.
class SyncEngine {
  SyncEngine({required this.api, required this.db, required this.deviceId});

  final ApiClient api;
  final AppDatabase db;
  final String deviceId;

  Future<void> syncNow() async {
    await _push();
    await _pull();
  }

  Future<void> _push() async {
    final dirty = await db
        .customSelect('SELECT * FROM local_recordings WHERE dirty = 1 LIMIT 200')
        .get();
    if (dirty.isEmpty) return;

    final rows = dirty.map((r) {
      final d = r.data;
      return {
        'id': d['id'],
        'entity': 'recording',
        'updatedAt': d['updated_at'],
        'version': d['version'],
        'deletedAt': d['deleted_at'],
        'payload': {
          'title': d['title'],
          'sourceType': d['source_type'],
          'captureStrategy': d['capture_strategy'],
          'qualityPreset': d['quality_preset'],
          'recordedAt': d['recorded_at'],
          'folderId': d['folder_id'],
          'categoryId': d['category_id'],
          'isFavorite': d['is_favorite'] == 1,
          'archivedAt': d['archived_at'],
          'trashedAt': d['trashed_at'],
          'durationSeconds': d['duration_seconds'],
          'consentAcknowledged': d['consent_acknowledged'] == 1,
          'consentAcknowledgedAt': d['consent_acknowledged_at'],
          'announcementPlayed': d['announcement_played'] == 1,
          'clientId': d['id'],
        },
      };
    }).toList();

    final res = await api.request('POST', '/v1/sync/push',
        jsonBody: {'deviceId': deviceId, 'rows': rows}) as Map<String, dynamic>;

    final applied = (res['applied'] as List<dynamic>? ?? const []).cast<String>().toSet();
    for (final id in applied) {
      await db.customStatement('UPDATE local_recordings SET dirty = 0 WHERE id = ?', [id]);
    }
    // Rejected rows: the server copy is newer — take it (last write wins).
    for (final rejection in (res['rejected'] as List<dynamic>? ?? const [])) {
      final server = (rejection as Map<String, dynamic>)['serverRow'] as Map<String, dynamic>?;
      if (server != null) await _applyServerRow(server);
    }
  }

  Future<void> _pull() async {
    final sinceRow = await db
        .customSelect("SELECT value FROM sync_state WHERE key = 'pull_cursor'")
        .getSingleOrNull();
    final since = sinceRow == null ? 0 : int.parse(sinceRow.read<String>('value'));

    final res = await api.request('GET', '/v1/sync/pull?deviceId=$deviceId&since=$since')
        as Map<String, dynamic>;

    for (final raw in (res['rows'] as List<dynamic>? ?? const [])) {
      await _applyServerRow(raw as Map<String, dynamic>);
    }
    await db.customStatement(
      "INSERT INTO sync_state (key, value) VALUES ('pull_cursor', ?) "
      'ON CONFLICT (key) DO UPDATE SET value = excluded.value',
      ['${res['cursor'] ?? since}'],
    );
  }

  Future<void> _applyServerRow(Map<String, dynamic> row) async {
    if (row['entity'] != 'recording') return; // folders/tags: same pattern, phase 5 wiring
    final incoming = SyncableRow(
      id: row['id'] as String,
      updatedAt: DateTime.parse(row['updatedAt'] as String),
      version: (row['version'] as num).toInt(),
      deletedAt: row['deletedAt'] == null ? null : DateTime.parse(row['deletedAt'] as String),
    );

    final localRow = await db
        .customSelect('SELECT id, updated_at, version, deleted_at, dirty FROM local_recordings WHERE id = ?',
            variables: [Variable.withString(incoming.id)])
        .getSingleOrNull();

    if (localRow != null) {
      final local = SyncableRow(
        id: incoming.id,
        updatedAt: DateTime.parse(localRow.read<String>('updated_at')),
        version: localRow.read<int>('version'),
        deletedAt: localRow.readNullable<String>('deleted_at') == null
            ? null
            : DateTime.parse(localRow.read<String>('deleted_at')),
      );
      // Local copy wins → keep it (it is dirty and will push next round).
      if (resolveConflict(local, incoming) != MergeDecision.remote) return;
    }

    final p = (row['payload'] as Map<String, dynamic>? ?? const {});
    await db.customStatement(
      'INSERT INTO local_recordings (id, title, source_type, capture_strategy, quality_preset, '
      'folder_id, category_id, duration_seconds, consent_acknowledged, consent_acknowledged_at, '
      'announcement_played, is_favorite, archived_at, trashed_at, recorded_at, upload_state, '
      'version, updated_at, deleted_at, dirty) '
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'uploaded\', ?, ?, ?, 0) '
      'ON CONFLICT (id) DO UPDATE SET title = excluded.title, folder_id = excluded.folder_id, '
      'category_id = excluded.category_id, duration_seconds = excluded.duration_seconds, '
      'is_favorite = excluded.is_favorite, archived_at = excluded.archived_at, '
      'trashed_at = excluded.trashed_at, version = excluded.version, '
      'updated_at = excluded.updated_at, deleted_at = excluded.deleted_at, dirty = 0',
      [
        incoming.id,
        p['title'] ?? 'Untitled',
        p['sourceType'] ?? 'mic',
        p['captureStrategy'],
        p['qualityPreset'] ?? 'standard',
        p['folderId'],
        p['categoryId'],
        p['durationSeconds'],
        (p['consentAcknowledged'] == true) ? 1 : 0,
        p['consentAcknowledgedAt'],
        (p['announcementPlayed'] == true) ? 1 : 0,
        (p['isFavorite'] == true) ? 1 : 0,
        p['archivedAt'],
        p['trashedAt'],
        p['recordedAt'] ?? incoming.updatedAt.toIso8601String(),
        incoming.version,
        incoming.updatedAt.toIso8601String(),
        incoming.deletedAt?.toIso8601String(),
      ],
    );

    // Fetch the transcript for newly-arrived recordings so offline search works.
    if (incoming.deletedAt == null) {
      try {
        final detail = await api.request('GET', '/v1/recordings/${incoming.id}') as Map<String, dynamic>;
        final transcript = detail['transcript'] as Map<String, dynamic>?;
        if (transcript != null) {
          await db.saveTranscript(
            recordingId: incoming.id,
            title: (p['title'] ?? detail['title'] ?? 'Untitled').toString(),
            text: transcript['text'] as String? ?? '',
            language: transcript['language'] as String?,
            segmentsJson: jsonEncode(transcript['segments'] ?? const []),
          );
        }
      } on ApiException {
        // Transcript not ready yet — the next sync round picks it up.
      }
    }
  }
}
