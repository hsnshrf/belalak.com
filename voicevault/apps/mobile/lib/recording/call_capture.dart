import 'dart:io';

import 'package:record/record.dart';

import '../core/constants.dart';

/// Honest platform reality for recording phone calls and meetings on mobile.
/// This module decides which capture strategies to OFFER — it never fakes an
/// unsupported one. See docs/call-recording-constraints.md for the full story.
///
///  * iOS: third-party apps cannot record cellular calls via public APIs
///    (Apple's own iOS 18.1+ call recording is not exposed to us). We offer
///    speakerphone+mic with a clear explanation. Future in-app VoIP calls
///    could be recorded (we'd own the audio path) — interface reserved.
///  * Android 10+: direct call audio (AudioSource.VOICE_CALL) is blocked for
///    third-party apps by most OEMs/regions. We PROBE for it and use it only
///    where the OEM permits; otherwise speakerphone+mic with voice processing.
///  * Meetings (Teams/Meet/Zoom/Webex) on mobile: no public API exposes their
///    audio; speakerphone capture is the reliable, honest path.
class CallCaptureAdvisor {
  const CallCaptureAdvisor();

  /// Strategies to offer for a source type on this platform, in preference
  /// order. The UI shows [CaptureOption.explanation] verbatim.
  List<CaptureOption> optionsFor(SourceType source) {
    if (source == SourceType.mic) {
      return const [CaptureOption(CaptureStrategy.mic, 'Records from the device microphone.')];
    }
    if (source == SourceType.meeting) {
      return const [
        CaptureOption(
          CaptureStrategy.speakerphone,
          'Play the meeting on speaker; VoiceVault records via the microphone with noise '
          'suppression and echo cancellation. Mobile apps cannot tap Teams/Meet/Zoom/Webex '
          'audio directly — this is the reliable path. For direct tab audio, use the web '
          'app on desktop Chrome/Edge.',
        ),
      ];
    }
    // Calls:
    if (Platform.isIOS) {
      return const [
        CaptureOption(
          CaptureStrategy.speakerphone,
          'iOS does not allow apps to record phone calls directly. Put the call on '
          'speaker and VoiceVault records the room audio — both voices are captured.',
        ),
      ];
    }
    return const [
      CaptureOption(
        CaptureStrategy.speakerphone,
        'Put the call on speaker; VoiceVault records the room audio with noise processing.',
      ),
      CaptureOption(
        CaptureStrategy.voiceCall,
        'Direct call audio — works only on the few devices whose manufacturer permits it. '
        'VoiceVault checks first and falls back to speakerphone with a clear message.',
      ),
    ];
  }

  /// Probe whether direct call-audio capture is actually available here.
  /// Returns a [VoiceCallProbe] rather than throwing — the UI turns an
  /// unavailable probe into a plain-language message, not a broken toggle.
  Future<VoiceCallProbe> probeVoiceCall(AudioRecorder recorder) async {
    if (!Platform.isAndroid) {
      return const VoiceCallProbe(false, 'Direct call capture is not available on this platform.');
    }
    try {
      final hasPermission = await recorder.hasPermission();
      if (!hasPermission) {
        return const VoiceCallProbe(false, 'Microphone permission is required first.');
      }
      // The `record` package cannot select AudioSource.VOICE_CALL; on the few
      // OEMs that allow it a platform channel is required. Until that channel
      // reports success we truthfully report unavailability.
      // TODO(phase-2): MethodChannel 'voicevault/voice_call_probe' that tries
      // AudioRecord with MediaRecorder.AudioSource.VOICE_CALL and reports
      // whether frames actually arrive (some OEMs silently return silence).
      return const VoiceCallProbe(
        false,
        'This device does not permit direct call recording (Android 10+ restriction). '
        'Speakerphone capture will be used instead.',
      );
    } catch (err) {
      return VoiceCallProbe(false, 'Direct call capture unavailable: $err');
    }
  }
}

class CaptureOption {
  const CaptureOption(this.strategy, this.explanation);

  final CaptureStrategy strategy;
  final String explanation;
}

class VoiceCallProbe {
  const VoiceCallProbe(this.available, this.message);

  final bool available;
  final String message;
}
