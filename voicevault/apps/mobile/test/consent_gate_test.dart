import 'package:flutter_test/flutter_test.dart';
import 'package:voicevault/core/constants.dart';
import 'package:voicevault/recording/consent_gate.dart';

void main() {
  const gate = ConsentGate(announcementDefaultOn: true);

  group('ConsentGate (consent flag persistence rules)', () {
    test('calls and meetings always require the consent prompt', () {
      expect(gate.requiresConsentPrompt(SourceType.call), isTrue);
      expect(gate.requiresConsentPrompt(SourceType.meeting), isTrue);
      expect(gate.requiresConsentPrompt(SourceType.mic), isFalse);
    });

    test('recording cannot start for a call until the prompt produced a decision', () {
      expect(gate.canStart(SourceType.call, null), isFalse);
      final decision = ConsentDecision(acknowledged: false, playAnnouncement: true, decidedAt: DateTime.now());
      expect(gate.canStart(SourceType.call, decision), isTrue);
      expect(gate.canStart(SourceType.mic, null), isTrue);
    });

    test('announcement defaults ON for call/meeting modes, OFF for mic notes', () {
      expect(gate.announcementDefaultFor(SourceType.call), isTrue);
      expect(gate.announcementDefaultFor(SourceType.meeting), isTrue);
      expect(gate.announcementDefaultFor(SourceType.mic), isFalse);
      const off = ConsentGate(announcementDefaultOn: false);
      expect(off.announcementDefaultFor(SourceType.call), isFalse);
    });

    test('metadata records the acknowledgment WITH its timestamp', () {
      final at = DateTime.utc(2026, 7, 4, 10);
      final meta = gate.metadataFor(
        SourceType.call,
        ConsentDecision(acknowledged: true, playAnnouncement: true, decidedAt: at),
      );
      expect(meta['consentAcknowledged'], isTrue);
      expect(meta['consentAcknowledgedAt'], '2026-07-04T10:00:00.000Z');
      expect(meta['announcementPlayed'], isTrue);
    });

    test('declined acknowledgment is stored honestly as false with no timestamp', () {
      final meta = gate.metadataFor(
        SourceType.call,
        ConsentDecision(acknowledged: false, playAnnouncement: true, decidedAt: DateTime.now()),
      );
      expect(meta['consentAcknowledged'], isFalse);
      expect(meta['consentAcknowledgedAt'], isNull);
    });
  });
}
