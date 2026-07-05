import 'dart:async';

import 'package:flutter/material.dart';

import '../core/constants.dart';
import '../i18n/strings.dart';
import '../recording/call_capture.dart';
import '../recording/consent_gate.dart';
import '../recording/recorder_service.dart';

class RecordScreen extends StatefulWidget {
  const RecordScreen({super.key, required this.recorder});

  final RecorderService recorder;

  @override
  State<RecordScreen> createState() => _RecordScreenState();
}

class _RecordScreenState extends State<RecordScreen> {
  static const _advisor = CallCaptureAdvisor();

  SourceType _source = SourceType.mic;
  QualityPreset _quality = QualityPreset.standard;
  bool _recording = false;
  bool _paused = false;
  int _elapsed = 0;
  double _level = 0;
  Timer? _ticker;
  StreamSubscription<String>? _errSub;
  String? _error;

  @override
  void initState() {
    super.initState();
    _errSub = widget.recorder.errors.listen((msg) {
      if (mounted) setState(() => _error = msg);
    });
    widget.recorder.amplitude().listen((amp) {
      // record reports dBFS (-160..0); map to 0..1 for the meter.
      if (mounted) setState(() => _level = ((amp.current + 50) / 50).clamp(0.0, 1.0));
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _errSub?.cancel();
    super.dispose();
  }

  Future<void> _start() async {
    setState(() => _error = null);
    final gate = ConsentGate(announcementDefaultOn: true);
    ConsentDecision? decision;
    if (gate.requiresConsentPrompt(_source)) {
      decision = await _showConsentDialog(gate.announcementDefaultFor(_source));
      if (decision == null) return; // user cancelled
    }
    final option = _advisor.optionsFor(_source).first;
    try {
      if (!await widget.recorder.hasMicPermission()) {
        setState(() => _error = 'Microphone permission is required.');
        return;
      }
      await widget.recorder.start(
        source: _source,
        strategy: option.strategy,
        quality: _quality,
        consent: decision,
      );
      setState(() {
        _recording = true;
        _elapsed = 0;
      });
      _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
        if (!_paused && mounted) setState(() => _elapsed += 1);
        if (_elapsed >= maxRecordingSeconds) unawaited(_stop());
      });
    } catch (err) {
      setState(() => _error = '$err');
    }
  }

  Future<void> _stop() async {
    _ticker?.cancel();
    try {
      await widget.recorder.stop();
    } catch (err) {
      setState(() => _error = '$err');
    }
    if (mounted) {
      setState(() {
        _recording = false;
        _paused = false;
      });
    }
  }

  Future<ConsentDecision?> _showConsentDialog(bool announceDefault) async {
    var ack = false;
    var announce = announceDefault;
    return showDialog<ConsentDecision>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(tr(context, 'consent.title')),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(tr(context, 'consent.body')),
              CheckboxListTile(
                value: ack,
                onChanged: (v) => setDialogState(() => ack = v ?? false),
                title: Text(tr(context, 'consent.ack')),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              CheckboxListTile(
                value: announce,
                onChanged: (v) => setDialogState(() => announce = v ?? false),
                title: Text(tr(context, 'consent.announce')),
                controlAffinity: ListTileControlAffinity.leading,
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: Text(tr(context, 'consent.cancel'))),
            FilledButton(
              onPressed: () => Navigator.pop(
                context,
                ConsentDecision(acknowledged: ack, playAnnouncement: announce, decidedAt: DateTime.now()),
              ),
              child: Text(tr(context, 'consent.continue')),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final option = _advisor.optionsFor(_source).first;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!_recording) ...[
            DropdownButtonFormField<SourceType>(
              value: _source,
              decoration: const InputDecoration(labelText: 'Source'),
              items: [
                DropdownMenuItem(value: SourceType.mic, child: Text(tr(context, 'record.source.mic'))),
                DropdownMenuItem(value: SourceType.meeting, child: Text(tr(context, 'record.source.meeting'))),
                DropdownMenuItem(value: SourceType.call, child: Text(tr(context, 'record.source.call'))),
              ],
              onChanged: (v) => setState(() => _source = v ?? SourceType.mic),
            ),
            const SizedBox(height: 8),
            // Honest per-platform explanation of what this capture mode does.
            Text(option.explanation, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 16),
            DropdownButtonFormField<QualityPreset>(
              value: _quality,
              decoration: const InputDecoration(labelText: 'Quality'),
              items: const [
                DropdownMenuItem(value: QualityPreset.voice, child: Text('Voice (Opus 32 kbps)')),
                DropdownMenuItem(value: QualityPreset.standard, child: Text('Standard (64 kbps)')),
                DropdownMenuItem(value: QualityPreset.high, child: Text('High (AAC 128 kbps)')),
              ],
              onChanged: (v) => setState(() => _quality = v ?? QualityPreset.standard),
            ),
          ],
          const Spacer(),
          if (_recording) ...[
            Center(
              child: Text(
                _fmt(_elapsed),
                style: const TextStyle(fontSize: 44, fontFeatures: []),
              ),
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(value: _level),
            const SizedBox(height: 24),
          ],
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_recording) ...[
                IconButton.filledTonal(
                  iconSize: 32,
                  icon: Icon(_paused ? Icons.play_arrow : Icons.pause),
                  onPressed: () async {
                    if (_paused) {
                      await widget.recorder.resume();
                    } else {
                      await widget.recorder.pause();
                    }
                    setState(() => _paused = !_paused);
                  },
                ),
                const SizedBox(width: 24),
              ],
              FloatingActionButton.large(
                backgroundColor: _recording ? Colors.red : null,
                onPressed: _recording ? _stop : _start,
                child: Icon(_recording ? Icons.stop : Icons.mic),
              ),
            ],
          ),
          const Spacer(),
        ],
      ),
    );
  }
}

String _fmt(int s) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${two(s ~/ 3600)}:${two((s % 3600) ~/ 60)}:${two(s % 60)}';
}
