# VoiceVault mobile (Flutter, iOS + Android)

Offline-first recorder: audio is written to a local file and a local SQLite
row FIRST; uploads, transcription and sync happen when the network allows.
Nothing is lost when connectivity, the battery, or the OS kills the app.

## Setup

```bash
flutter pub get
# Generate Drift bindings (required once, and after schema changes):
dart run build_runner build --delete-conflicting-outputs
flutter run --dart-define=VV_API_BASE=http://<your-api-host>:4000
```

`flutter create --platforms=android,ios .` regenerates the platform folders
if needed; then re-apply:
- **Android**: `android/app/src/main/AndroidManifest.xml` in this repo is the
  reference (RECORD_AUDIO, microphone-typed foreground service for background
  recording, no fake call-capture permissions).
- **iOS**: merge `ios/Runner/Info-additions.plist` into `Info.plist`
  (mic usage string, `UIBackgroundModes: audio` for background recording).

### Xcode signing notes

Open `ios/Runner.xcworkspace`, set your Team under Signing & Capabilities,
enable "Background Modes → Audio". No special entitlements are needed — the
app deliberately uses only public, App-Store-safe APIs.

## Architecture

| Concern | Where | Notes |
|---|---|---|
| Recording | `lib/recording/recorder_service.dart` | `record` pkg → one continuous file; echo/noise suppression on for speakerphone capture |
| Chunked upload | `lib/recording/chunker.dart` | byte-range chunks every 5 min; manifest persisted per chunk |
| Interruption recovery | `lib/recording/recovery.dart` | on every launch: re-ship missing ranges + tail, complete session |
| Consent | `lib/recording/consent_gate.dart` | prompt mandatory for calls/meetings; ack + timestamp stored write-once |
| Platform honesty | `lib/recording/call_capture.dart` | iOS: no cellular call capture, period; Android: VOICE_CALL probe with graceful fallback |
| Offline store | `lib/data/tables.drift` + `database.dart` | Drift/SQLite, FTS5 (`unicode61 remove_diacritics 2`) for offline search |
| Sync | `lib/sync/` | LWW + tombstones, mirrors `packages/shared/src/sync.ts` |
| Playback | `lib/ui/player_screen.dart` | just_audio, karaoke word highlighting, tap-word-to-seek, 0.5–3× speed |
| Search | `lib/ui/search_screen.dart` | FTS5 offline + server merge; hits open the player at the matched second |
| i18n | `lib/i18n/strings.dart` | EN + AR; RTL layouts via Flutter localization delegates |

## Tests

```bash
flutter test
```

Covers: sync conflict resolution (LWW + tombstones), audio chunking/upload
planning + manifest recovery, consent gate rules and persistence metadata,
and offline search timestamp mapping (incl. Arabic diacritics).

## Honest limitations (also shown in-app)

- **Cellular call recording**: not possible on iOS; blocked on most Android
  10+ devices. The app offers speakerphone capture and explains why.
- **Meeting apps (Teams/Meet/Zoom/Webex)**: no public API exposes their audio
  on mobile; speakerphone capture is the reliable path. Desktop Chrome/Edge
  users get true tab-audio capture in the web app.
