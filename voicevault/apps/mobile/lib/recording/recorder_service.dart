import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:uuid/uuid.dart';

import '../api/api_client.dart';
import '../core/constants.dart';
import '../data/database.dart';
import 'chunker.dart';
import 'consent_gate.dart';

/// Records to ONE continuous local file (offline-first: the file is the source
/// of truth) while shipping 5-minute byte-range chunks whenever online. The
/// upload manifest is persisted per chunk, so an app kill, incoming call or
/// battery death loses at most the un-flushed tail — recovery re-ships the
/// rest on next launch (see recovery.dart).
///
/// Background recording:
///  * Android — android:foregroundServiceType="microphone" (manifest) keeps
///    capture alive with the app backgrounded; the `record` package holds the
///    mic session.
///  * iOS — UIBackgroundModes audio (Info.plist) keeps the AVAudioSession
///    running in background.
class RecorderService {
  RecorderService({required this.api, required this.db});

  final ApiClient api;
  final AppDatabase db;
  final AudioRecorder _recorder = AudioRecorder();

  String? _recordingId;
  String? _sessionId;
  String? _filePath;
  RollingChunker? _chunker;
  Timer? _shipTimer;
  DateTime? _startedAt;
  bool _stopping = false;

  final _errors = StreamController<String>.broadcast();
  Stream<String> get errors => _errors.stream;

  Stream<Amplitude> amplitude() =>
      _recorder.onAmplitudeChanged(const Duration(milliseconds: 250));

  bool get isRecording => _recordingId != null;

  Future<bool> hasMicPermission() => _recorder.hasPermission();

  Future<String> start({
    required SourceType source,
    required CaptureStrategy strategy,
    required QualityPreset quality,
    required ConsentDecision? consent,
  }) async {
    final gate = ConsentGate(announcementDefaultOn: true);
    if (!gate.canStart(source, consent)) {
      throw StateError('Consent flow must complete before recording a ${source.name}');
    }

    final id = const Uuid().v4();
    final dir = await getApplicationDocumentsDirectory();
    final ext = quality == QualityPreset.high ? 'm4a' : 'opus';
    final path = p.join(dir.path, 'recordings', '$id.$ext');
    await Directory(p.dirname(path)).create(recursive: true);

    final consentMeta = gate.metadataFor(source, consent);
    final now = DateTime.now().toUtc().toIso8601String();
    // Local row FIRST (offline-first): the recording exists even if the
    // network never does.
    await db.customStatement(
      'INSERT INTO local_recordings (id, title, source_type, capture_strategy, quality_preset, '
      'consent_acknowledged, consent_acknowledged_at, announcement_played, recorded_at, '
      'local_audio_path, upload_state, updated_at) '
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
      [
        id,
        _defaultTitle(DateTime.now()),
        source.name,
        strategy.wire,
        quality.name,
        (consentMeta['consentAcknowledged'] == true) ? 1 : 0,
        consentMeta['consentAcknowledgedAt'],
        (consentMeta['announcementPlayed'] == true) ? 1 : 0,
        now,
        path,
        now,
      ],
    );

    await _recorder.start(
      RecordConfig(
        encoder: quality == QualityPreset.high ? AudioEncoder.aacLc : AudioEncoder.opus,
        bitRate: quality.bitrateKbps * 1000,
        sampleRate: 48000,
        numChannels: 1,
        // Voice processing helps the speakerphone capture path substantially.
        echoCancel: true,
        noiseSuppress: true,
        autoGain: true,
      ),
      path: path,
    );

    _recordingId = id;
    _filePath = path;
    _startedAt = DateTime.now();
    _chunker = RollingChunker(
      minChunkBytes: bytesForSeconds(seconds: uploadChunkSeconds, bitrateKbps: quality.bitrateKbps),
    );
    _stopping = false;

    // Try to open the server session now; offline is fine — the sync/recovery
    // path uploads later.
    unawaited(_openServerSession(id, source, strategy, quality, consentMeta));

    _shipTimer = Timer.periodic(const Duration(seconds: 30), (_) => _shipReadyChunks());
    return id;
  }

  Future<void> pause() => _recorder.pause();
  Future<void> resume() => _recorder.resume();

  Future<String> stop() async {
    final id = _recordingId;
    if (id == null) throw StateError('not recording');
    _stopping = true;
    _shipTimer?.cancel();
    await _recorder.stop();

    final elapsed = _startedAt == null ? null : DateTime.now().difference(_startedAt!).inSeconds;
    await db.customStatement(
      'UPDATE local_recordings SET duration_seconds = ?, dirty = 1, updated_at = ? WHERE id = ?',
      [elapsed, DateTime.now().toUtc().toIso8601String(), id],
    );

    try {
      await _flushRemaining();
      await _completeSession();
      await db.customStatement(
        "UPDATE local_recordings SET upload_state = 'uploaded' WHERE id = ?", [id]);
    } catch (err) {
      // Loud, not silent: state stays 'failed' and the UI offers retry; the
      // local file remains the source of truth either way.
      await db.customStatement(
        "UPDATE local_recordings SET upload_state = 'failed' WHERE id = ?", [id]);
      _errors.add('Upload incomplete — audio is safe on this device. $err');
    } finally {
      _recordingId = null;
      _sessionId = null;
      _filePath = null;
      _chunker = null;
    }
    return id;
  }

  Future<void> _openServerSession(
    String id,
    SourceType source,
    CaptureStrategy strategy,
    QualityPreset quality,
    Map<String, Object?> consentMeta,
  ) async {
    try {
      final rec = await api.request('POST', '/v1/recordings', jsonBody: {
        'clientId': id,
        'sourceType': source.name,
        'captureStrategy': strategy.wire,
        'qualityPreset': quality.name,
        'recordedAt': DateTime.now().toUtc().toIso8601String(),
        'consentAcknowledged': consentMeta['consentAcknowledged'],
        'announcementPlayed': consentMeta['announcementPlayed'],
      }) as Map<String, dynamic>;
      final session = await api.request('POST', '/v1/uploads/sessions', jsonBody: {
        'recordingId': rec['id'],
        'mimeType': quality == QualityPreset.high ? 'audio/mp4' : 'audio/opus',
      }) as Map<String, dynamic>;
      _sessionId = session['sessionId'] as String;
      await db.customStatement(
        'UPDATE upload_manifest SET session_id = ? WHERE recording_id = ?', [_sessionId, id]);
    } catch (_) {
      // Offline — recovery/sync uploads the whole file later.
    }
  }

  Future<void> _shipReadyChunks() async {
    final chunker = _chunker;
    final path = _filePath;
    final sessionId = _sessionId;
    if (chunker == null || path == null || _stopping) return;
    final file = File(path);
    if (!file.existsSync()) return;
    final range = chunker.cut(file.lengthSync());
    if (range == null) return;
    await _shipRange(file, range, isLast: false, sessionId: sessionId);
  }

  Future<void> _flushRemaining() async {
    final chunker = _chunker;
    final path = _filePath;
    if (chunker == null || path == null) return;
    final file = File(path);
    final range = chunker.finalize(file.lengthSync());
    if (range != null) {
      await _shipRange(file, range, isLast: true, sessionId: _sessionId);
    } else if (chunker.nextSeq > 0) {
      // All bytes shipped but the server needs to know which seq was last.
      await db.customStatement(
        'UPDATE upload_manifest SET uploaded = 1 WHERE recording_id = ?', [_recordingId]);
    }
  }

  Future<void> _shipRange(File file, ChunkRange range, {required bool isLast, String? sessionId}) async {
    // Manifest row BEFORE the network call — recovery needs to know the plan.
    await db.customStatement(
      'INSERT INTO upload_manifest (recording_id, session_id, seq, start_byte, end_byte, uploaded) '
      'VALUES (?, ?, ?, ?, ?, 0) ON CONFLICT (recording_id, seq) DO NOTHING',
      [_recordingId, sessionId, range.seq, range.start, range.end],
    );
    if (sessionId == null) return; // offline: bytes stay local, manifest remembers

    final raf = await file.open();
    try {
      await raf.setPosition(range.start);
      final bytes = await raf.read(range.length);
      await api.uploadChunk(
        sessionId: sessionId,
        seq: range.seq,
        bytes: Uint8List.fromList(bytes),
        isLast: isLast,
      );
      await db.customStatement(
        'UPDATE upload_manifest SET uploaded = 1 WHERE recording_id = ? AND seq = ?',
        [_recordingId, range.seq],
      );
    } finally {
      await raf.close();
    }
  }

  Future<void> _completeSession() async {
    final sessionId = _sessionId;
    if (sessionId == null) return;
    await api.request('POST', '/v1/uploads/sessions/$sessionId/complete');
  }
}

String _defaultTitle(DateTime t) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${t.year}-${two(t.month)}-${two(t.day)} ${two(t.hour)}:${two(t.minute)}';
}
