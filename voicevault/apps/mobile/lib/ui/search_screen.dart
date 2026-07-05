import 'dart:async';

import 'package:drift/drift.dart' show Variable;
import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../data/database.dart';
import '../i18n/strings.dart';
import '../search/match_locator.dart';
import 'player_screen.dart';

class _Hit {
  const _Hit({required this.recordingId, required this.title, required this.snippet, this.timeSeconds});

  final String recordingId;
  final String title;
  final String snippet;
  final double? timeSeconds;
}

/// Search works OFFLINE against the local FTS5 index; when online it also
/// queries the server (which sees recordings not yet synced to this device).
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, required this.db, required this.api});

  final AppDatabase db;
  final ApiClient api;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();
  List<_Hit> _hits = const [];
  bool _offlineOnly = false;
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String q) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () => _run(q.trim()));
  }

  Future<void> _run(String q) async {
    if (q.isEmpty) {
      setState(() => _hits = const []);
      return;
    }
    final local = await _searchLocal(q);
    var merged = local;
    var offline = true;
    try {
      final server = await _searchServer(q);
      final seen = local.map((h) => '${h.recordingId}@${h.timeSeconds}').toSet();
      merged = [...local, ...server.where((h) => !seen.contains('${h.recordingId}@${h.timeSeconds}'))];
      offline = false;
    } on Exception {
      // Offline — local FTS5 results are the answer.
    }
    if (mounted) {
      setState(() {
        _hits = merged;
        _offlineOnly = offline;
      });
    }
  }

  /// FTS5 finds matching recordings; match_locator pins each hit to its
  /// word-level audio timestamp from the locally stored segments.
  Future<List<_Hit>> _searchLocal(String q) async {
    final ftsQuery = q.split(RegExp(r'\s+')).map((t) => '"${t.replaceAll('"', '')}"').join(' ');
    final rows = await widget.db
        .customSelect(
          'SELECT f.recording_id, f.title FROM transcript_fts f WHERE transcript_fts MATCH ? LIMIT 25',
          variables: [Variable.withString(ftsQuery)],
        )
        .get();
    final hits = <_Hit>[];
    for (final row in rows) {
      final recordingId = row.read<String>('recording_id');
      final title = row.read<String>('title');
      final segments = await widget.db.segmentsFor(recordingId);
      final located = locateMatches(segments, q, maxMatches: 3);
      if (located.isEmpty) {
        hits.add(_Hit(recordingId: recordingId, title: title, snippet: title));
      } else {
        hits.addAll(located.map((m) =>
            _Hit(recordingId: recordingId, title: title, snippet: m.snippet, timeSeconds: m.timeSeconds)));
      }
    }
    return hits;
  }

  Future<List<_Hit>> _searchServer(String q) async {
    final res = await widget.api.request('POST', '/v1/search', jsonBody: {'q': q, 'limit': 20, 'offset': 0})
        as Map<String, dynamic>;
    final hits = <_Hit>[];
    for (final r in (res['results'] as List<dynamic>? ?? const [])) {
      final m = r as Map<String, dynamic>;
      for (final match in (m['matches'] as List<dynamic>? ?? const [])) {
        final mm = match as Map<String, dynamic>;
        hits.add(_Hit(
          recordingId: m['recordingId'] as String,
          title: m['title'] as String,
          snippet: (mm['snippetHtml'] as String? ?? '')
              .replaceAll('<mark>', '«')
              .replaceAll('</mark>', '»')
              .replaceAll(RegExp('<[^>]+>'), ''),
          timeSeconds: (mm['timeSeconds'] as num?)?.toDouble(),
        ));
      }
    }
    return hits;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: _controller,
            onChanged: _onChanged,
            textDirection: null, // let the framework infer for RTL queries
            decoration: InputDecoration(
              hintText: tr(context, 'search.hint'),
              prefixIcon: const Icon(Icons.search),
              border: const OutlineInputBorder(),
            ),
          ),
        ),
        if (_offlineOnly && _hits.isNotEmpty)
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Chip(label: Text(tr(context, 'search.offline'))),
            ),
          ),
        Expanded(
          child: ListView.builder(
            itemCount: _hits.length,
            itemBuilder: (context, i) {
              final h = _hits[i];
              return ListTile(
                title: Text(h.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                subtitle: Text(h.snippet, maxLines: 2, overflow: TextOverflow.ellipsis),
                trailing: h.timeSeconds != null ? Text(_fmtTime(h.timeSeconds!)) : null,
                onTap: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => PlayerScreen(
                    db: widget.db,
                    api: widget.api,
                    recordingId: h.recordingId,
                    initialSeekSeconds: h.timeSeconds,
                  ),
                )),
              );
            },
          ),
        ),
      ],
    );
  }
}

String _fmtTime(double s) {
  final m = s ~/ 60;
  final sec = (s % 60).floor();
  return '$m:${sec.toString().padLeft(2, '0')}';
}
