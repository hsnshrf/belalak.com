import 'dart:async';

import 'package:drift/drift.dart' show Variable;
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

import '../api/api_client.dart';
import '../core/constants.dart';
import '../core/models.dart';
import '../data/database.dart';

/// Playback with karaoke-style transcript sync: the word under the playhead
/// is highlighted; tapping any word seeks there. Prefers the local audio file
/// (offline-first) and falls back to the server's signed URL.
class PlayerScreen extends StatefulWidget {
  const PlayerScreen({
    super.key,
    required this.db,
    required this.api,
    required this.recordingId,
    this.initialSeekSeconds,
  });

  final AppDatabase db;
  final ApiClient api;
  final String recordingId;
  final double? initialSeekSeconds;

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  final _player = AudioPlayer();
  List<TranscriptSegment> _segments = const [];
  String? _title;
  String? _language;
  String? _error;
  double _position = 0;
  double _speed = 1;
  StreamSubscription<Duration>? _posSub;

  @override
  void initState() {
    super.initState();
    unawaited(_load());
  }

  @override
  void dispose() {
    _posSub?.cancel();
    _player.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final row = await widget.db
          .customSelect('SELECT title, local_audio_path FROM local_recordings WHERE id = ?',
              variables: [Variable.withString(widget.recordingId)])
          .getSingleOrNull();
      _title = row?.readNullable<String>('title');
      final localPath = row?.readNullable<String>('local_audio_path');

      var segments = await widget.db.segmentsFor(widget.recordingId);
      if (segments.isEmpty) {
        // Not synced yet — try the server.
        try {
          final detail =
              await widget.api.request('GET', '/v1/recordings/${widget.recordingId}') as Map<String, dynamic>;
          final transcript = detail['transcript'] as Map<String, dynamic>?;
          if (transcript != null) {
            segments = ((transcript['segments'] as List<dynamic>?) ?? const [])
                .map((s) => TranscriptSegment.fromJson(s as Map<String, dynamic>))
                .toList();
            _language = transcript['language'] as String?;
          }
          if (localPath == null) {
            final url = detail['audioUrl'] as String?;
            if (url != null) await _player.setUrl(url);
          }
        } on ApiException catch (err) {
          _error = err.message;
        }
      }
      if (localPath != null) {
        await _player.setFilePath(localPath);
      }
      setState(() => _segments = segments);

      _posSub = _player.positionStream.listen((d) {
        if (mounted) setState(() => _position = d.inMilliseconds / 1000);
      });
      if (widget.initialSeekSeconds != null) {
        await _seek(widget.initialSeekSeconds!);
      }
    } catch (err) {
      setState(() => _error = '$err');
    }
  }

  Future<void> _seek(double seconds) async {
    await _player.seek(Duration(milliseconds: (seconds * 1000).round()));
    if (!_player.playing) await _player.play();
  }

  @override
  Widget build(BuildContext context) {
    final dir = _language != null && rtlLocales.contains(_language!.split('-').first)
        ? TextDirection.rtl
        : TextDirection.ltr;
    return Scaffold(
      appBar: AppBar(title: Text(_title ?? '…', maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: Column(
        children: [
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
          Expanded(
            child: _segments.isEmpty
                ? const Center(child: Text('Transcript not available yet'))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _segments.length,
                    itemBuilder: (context, i) => _segmentParagraph(_segments[i], dir),
                  ),
          ),
          _controls(),
        ],
      ),
    );
  }

  Widget _segmentParagraph(TranscriptSegment seg, TextDirection docDir) {
    final segDir = seg.language != null && rtlLocales.contains(seg.language!.split('-').first)
        ? TextDirection.rtl
        : docDir;
    final theme = Theme.of(context);
    final baseStyle = DefaultTextStyle.of(context).style.copyWith(height: 1.8, fontSize: 16);
    return Directionality(
      textDirection: segDir,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Wrap(
          children: [
            if (seg.speaker != null)
              Text(
                '${_speakerName(seg.speaker!)}  ',
                style: baseStyle.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
              ),
            if (seg.words.isEmpty)
              // Edited segments may lack word timing — seek to segment start.
              GestureDetector(onTap: () => _seek(seg.start), child: Text(seg.text, style: baseStyle))
            else
              for (final w in seg.words)
                GestureDetector(
                  // Tap any word → seek the player to that exact moment.
                  onTap: () => _seek(w.start),
                  child: Text(
                    '${w.text} ',
                    style: (_position >= w.start && _position < w.end)
                        ? baseStyle.copyWith(
                            backgroundColor: theme.colorScheme.primary,
                            color: theme.colorScheme.onPrimary,
                          )
                        : baseStyle,
                  ),
                ),
          ],
        ),
      ),
    );
  }

  String _speakerName(String label) {
    final n = label.replaceAll(RegExp(r'\D'), '');
    return n.isEmpty ? label : 'Speaker $n';
  }

  Widget _controls() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(icon: const Icon(Icons.replay), onPressed: () => _seek((_position - 15).clamp(0, double.infinity))),
          StreamBuilder<PlayerState>(
            stream: _player.playerStateStream,
            builder: (context, snap) {
              final playing = snap.data?.playing ?? false;
              return IconButton.filled(
                iconSize: 36,
                icon: Icon(playing ? Icons.pause : Icons.play_arrow),
                onPressed: () => playing ? _player.pause() : _player.play(),
              );
            },
          ),
          IconButton(icon: const Icon(Icons.fast_forward), onPressed: () => _seek(_position + 15)),
          const SizedBox(width: 12),
          DropdownButton<double>(
            value: _speed,
            items: const [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0]
                .map((v) => DropdownMenuItem(value: v, child: Text('${v}×')))
                .toList(),
            onChanged: (v) async {
              if (v == null) return;
              setState(() => _speed = v);
              await _player.setSpeed(v);
            },
          ),
        ],
      ),
    );
  }
}
