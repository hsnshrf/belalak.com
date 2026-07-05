import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../data/database.dart';
import '../i18n/strings.dart';
import '../sync/sync_engine.dart';
import 'player_screen.dart';

/// Library list — reads the LOCAL database (offline-first); pull-to-refresh
/// triggers a sync round when online.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.db, required this.api, required this.sync});

  final AppDatabase db;
  final ApiClient api;
  final SyncEngine sync;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Map<String, Object?>> _rows = const [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final rows = await widget.db
        .customSelect(
          'SELECT id, title, source_type, recorded_at, duration_seconds, language, '
          'transcription_status, is_favorite, upload_state, consent_acknowledged '
          'FROM local_recordings WHERE deleted_at IS NULL AND trashed_at IS NULL '
          'ORDER BY recorded_at DESC',
        )
        .get();
    if (mounted) setState(() => _rows = rows.map((r) => r.data).toList());
  }

  Future<void> _refresh() async {
    try {
      await widget.sync.syncNow();
      setState(() => _error = null);
    } catch (err) {
      setState(() => _error = 'Sync failed: $err');
    }
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: _rows.isEmpty
          ? ListView(children: [
              const SizedBox(height: 120),
              Center(child: Text(tr(context, 'library.empty'))),
              if (_error != null)
                Padding(padding: const EdgeInsets.all(16), child: Text(_error!, style: const TextStyle(color: Colors.red))),
            ])
          : ListView.builder(
              itemCount: _rows.length,
              itemBuilder: (context, i) {
                final r = _rows[i];
                final status = r['transcription_status'] as String?;
                final uploadState = r['upload_state'] as String?;
                return ListTile(
                  leading: Icon(switch (r['source_type']) {
                    'meeting' => Icons.groups,
                    'call' => Icons.call,
                    _ => Icons.mic,
                  }),
                  title: Text(r['title'] as String, maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text([
                    (r['recorded_at'] as String).replaceFirst('T', ' ').split('.').first,
                    if (r['language'] != null) r['language'] as String,
                    if (uploadState == 'failed') '⚠ upload incomplete — audio safe on device',
                    if (status == 'processing' || status == 'queued') tr(context, 'library.transcribing'),
                  ].join(' · ')),
                  trailing: (r['is_favorite'] as int? ?? 0) == 1 ? const Icon(Icons.star, size: 18) : null,
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => PlayerScreen(db: widget.db, api: widget.api, recordingId: r['id'] as String),
                  )),
                );
              },
            ),
    );
  }
}
