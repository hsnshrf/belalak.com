import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import 'api/api_client.dart';
import 'app.dart';
import 'data/database.dart';
import 'recording/recorder_service.dart';
import 'recording/recovery.dart';
import 'sync/sync_engine.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  const apiBase = String.fromEnvironment('VV_API_BASE', defaultValue: 'http://10.0.2.2:4000');
  final db = AppDatabase();
  final api = ApiClient(baseUrl: apiBase);
  final recorder = RecorderService(api: api, db: db);
  final sync = SyncEngine(api: api, db: db, deviceId: await _deviceId());
  final recovery = InterruptionRecovery(api: api, db: db);

  // Interruption recovery on every launch: repair uploads of recordings that
  // were cut short (app kill / incoming call / battery death), then sync.
  unawaited(recovery.recoverPending().then((ids) {
    if (ids.isNotEmpty) {
      debugPrint('Recovered ${ids.length} interrupted recording(s): $ids');
    }
    return sync.syncNow();
  }).catchError((Object err) {
    debugPrint('startup sync/recovery deferred: $err'); // offline is normal
  }));

  runApp(VoiceVaultApp(db: db, api: api, recorder: recorder, sync: sync));
}

/// Stable per-install id used as the sync device identity.
Future<String> _deviceId() async {
  final prefs = await SharedPreferences.getInstance();
  var id = prefs.getString('vv.deviceId');
  if (id == null) {
    id = const Uuid().v4();
    await prefs.setString('vv.deviceId', id);
  }
  return id;
}
