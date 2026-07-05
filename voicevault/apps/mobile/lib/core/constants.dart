/// Cross-app constants — mirrors packages/shared/src/constants.ts.
/// Keep the two files in sync.
library;

const int maxRecordingSeconds = 6 * 60 * 60; // 6 hours
const int uploadChunkSeconds = 5 * 60; // rolling 5-minute chunks
const int trashRetentionDays = 30;
const int transcriptionMaxAttempts = 3;

enum QualityPreset { voice, standard, high }

extension QualityPresetX on QualityPreset {
  int get bitrateKbps => switch (this) {
        QualityPreset.voice => 32,
        QualityPreset.standard => 64,
        QualityPreset.high => 128,
      };

  /// Container/codec used by the `record` package for this preset.
  String get codec => switch (this) {
        QualityPreset.voice => 'opus',
        QualityPreset.standard => 'opus',
        QualityPreset.high => 'aacLc',
      };
}

enum SourceType { mic, meeting, call }

enum CaptureStrategy { mic, tabAudio, speakerphone, voiceCall, meetingBot }

extension CaptureStrategyWire on CaptureStrategy {
  String get wire => switch (this) {
        CaptureStrategy.mic => 'mic',
        CaptureStrategy.tabAudio => 'tab_audio',
        CaptureStrategy.speakerphone => 'speakerphone',
        CaptureStrategy.voiceCall => 'voice_call',
        CaptureStrategy.meetingBot => 'meeting_bot',
      };
}

const Set<String> rtlLocales = {'ar', 'fa', 'ur', 'he'};
