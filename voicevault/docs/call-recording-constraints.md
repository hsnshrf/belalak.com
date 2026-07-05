# Phone-call recording — platform constraints (and what we do about them)

VoiceVault does not fake unsupported capabilities. This is the honest map.

## iOS

- **Cellular calls: not possible.** Apple provides no public API for
  third-party apps to access call audio, and workarounds are both unreliable
  and App Store-fatal. We do not attempt them.
- **iOS 18.1+**: Apple's native Phone-app call recording exists but is not
  exposed to third-party apps; users can record there and import the file.
- **What we offer**: speakerphone + mic capture with echo cancellation and
  noise suppression, and an on-screen explanation (see
  `apps/mobile/lib/recording/call_capture.dart`).
- **Future**: if in-app VoIP calling is added, those calls CAN be recorded
  (we own the audio path); the capture interface reserves this case.

## Android

- **Android 10+** blocks direct call audio (`AudioSource.VOICE_CALL`) for
  third-party apps in most regions and OEM builds; `CAPTURE_AUDIO_OUTPUT` is
  system-app-only.
- **What we offer**: speakerphone + mic capture (default), with a
  `VOICE_CALL` **probe** that only enables direct capture where the OEM
  actually permits it — and verifies frames arrive, because some OEMs return
  silence instead of erroring. Until the platform-channel probe ships, the
  advisor truthfully reports "unavailable" everywhere
  (`call_capture.dart`, TODO marked).
- The manifest deliberately omits any call-capture permission we can't use.

## Web

- Cellular calls: N/A. Browser/WebRTC calls are captured via Strategy A
  (tab/window audio + mic) on Chromium browsers — see
  `docs/meeting-capture.md` for the support matrix.
