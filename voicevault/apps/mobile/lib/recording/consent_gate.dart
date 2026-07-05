/// Consent & compliance gate — pure logic, unit-tested.
///
/// Product rules (see docs/consent.md):
///  * Call and meeting recordings ALWAYS show the consent reminder first.
///  * The user's acknowledgment (whatever they answer) is stored with the
///    recording; it is write-once.
///  * The verbal announcement defaults ON for call/meeting modes and is
///    configurable in settings.
library;

import '../core/constants.dart';

class ConsentDecision {
  const ConsentDecision({
    required this.acknowledged,
    required this.playAnnouncement,
    required this.decidedAt,
  });

  final bool acknowledged;
  final bool playAnnouncement;
  final DateTime decidedAt;
}

class ConsentGate {
  const ConsentGate({required this.announcementDefaultOn});

  /// Settings toggle; ON by default for call/meeting modes.
  final bool announcementDefaultOn;

  /// Plain mic notes don't involve other parties by default; calls and
  /// meetings always require the reminder flow.
  bool requiresConsentPrompt(SourceType source) =>
      source == SourceType.call || source == SourceType.meeting;

  bool announcementDefaultFor(SourceType source) =>
      requiresConsentPrompt(source) && announcementDefaultOn;

  /// A recording may start when either no prompt is required, or the prompt
  /// has produced a decision (any decision — the acknowledgment is the user's
  /// legal statement, not something the app can decide for them).
  bool canStart(SourceType source, ConsentDecision? decision) =>
      !requiresConsentPrompt(source) || decision != null;

  /// Metadata to persist with the recording, exactly once, at creation.
  Map<String, Object?> metadataFor(SourceType source, ConsentDecision? decision) => {
        'consentAcknowledged': decision?.acknowledged ?? false,
        'consentAcknowledgedAt':
            (decision?.acknowledged ?? false) ? decision!.decidedAt.toUtc().toIso8601String() : null,
        'announcementPlayed': decision?.playAnnouncement ?? false,
      };
}
