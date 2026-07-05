# @voicevault/web

Next.js (App Router) web app: record from the microphone or capture meeting
tab audio, watch the transcript sync with playback, and search every word.

## Run

```bash
# from voicevault/ root, with the API running on :4000
npm run dev --workspace apps/web    # http://localhost:3000
```

Environment: `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:4000`).

## Browser support matrix (meeting/tab-audio capture)

| Browser        | Mic recording | Tab/meeting audio (`getDisplayMedia` audio) |
|----------------|---------------|---------------------------------------------|
| Chrome         | ✅            | ✅ share a **tab** + tick “Also share tab audio” |
| Edge           | ✅            | ✅ same as Chrome                            |
| Firefox        | ✅            | ❌ display capture has no audio             |
| Safari         | ✅            | ❌ no tab/system audio — the UI says so and suggests Chrome/Edge or speaker+mic |

These limits are shown to users in the record screen (`tabAudioSupport()` in
`src/lib/audio/capture.ts`) — we never pretend an unsupported path works.

## How recording works

- `MediaRecorder` with a 5-minute timeslice → each slice is SHA-256-hashed and
  uploaded immediately (`src/lib/audio/recorder.ts`); a dropped connection
  costs at most one chunk, and uploads retry with backoff before failing
  loudly.
- Meeting capture mixes `getDisplayMedia` audio with the microphone through
  the Web Audio API so both sides of the conversation are recorded.
- Consent dialog (mandatory for call/meeting sources) records the
  acknowledgment with the recording; the announcement tone is on by default.

## i18n / RTL

UI ships in English and Arabic (`src/lib/i18n/`). The `<html dir>` attribute
follows the locale; transcripts additionally set direction per segment so
mixed-language (code-switched) conversations render correctly.
