# Meeting capture (Teams, Google Meet, Zoom, Webex)

Three strategies; the user picks per recording. None of them pretend to
intercept another app's audio — that is not possible via public APIs on
mobile, and we don't claim otherwise.

## Strategy A — tab/system audio on desktop web (primary)

`getDisplayMedia({ audio: true })`: the user shares the meeting tab with
audio; VoiceVault mixes it with the microphone via Web Audio so both sides
are captured (`apps/web/src/lib/audio/capture.ts`).

| Browser | Tab audio | Notes shown in UI |
|---|---|---|
| Chrome  | ✅ | pick a **tab** + tick "Also share tab audio" |
| Edge    | ✅ | same |
| Firefox | ❌ | display capture carries no audio |
| Safari  | ❌ | no tab/system audio — UI suggests Chrome/Edge or speaker+mic |

## Strategy B — speakerphone capture on mobile (the honest mobile path)

Meeting plays on the loudspeaker; VoiceVault records via the microphone with
echo cancellation, noise suppression and auto-gain
(`apps/mobile/lib/recording/recorder_service.dart`). Presented in the UI as
exactly what it is: the reliable way to capture meetings on a phone.

## Strategy C — server-side meeting bot (phase 2, scaffold only)

A bot participant joins the meeting via each platform's server API and
records cloud-side. The service interface, config and stub implementations
live in `apps/api/src/meeting-bot/`; per-platform API requirements and
approval processes are documented in `docs/meeting-bot.md`. Endpoint returns
501 until implemented.
