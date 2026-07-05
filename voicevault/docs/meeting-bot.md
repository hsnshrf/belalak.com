# Meeting bot (Strategy C) — phase-2 design

A server-side bot joins the meeting as a **visible, named participant**
("VoiceVault Notetaker"), records cloud-side, and pushes audio through the
standard chunked-upload → transcription pipeline. Code scaffold:
`apps/api/src/meeting-bot/` (interface + per-platform stubs, endpoint returns
501 until implemented).

## Non-negotiable product rules

1. The bot never joins covertly — it appears in the participant list with a
   clear name, and the requesting user must complete the consent flow first.
2. Host controls win: denied admission or removal ⇒ the bot leaves and the
   session is marked `failed`, never retried silently.
3. Each platform's own recording-disclosure mechanism stays enabled.

## Per-platform requirements (research summary, verify before build)

| | Zoom | Microsoft Teams | Google Meet | Webex |
|---|---|---|---|---|
| App registration | Server-to-Server OAuth + Meeting SDK app | Azure Bot + Entra app | Workspace service account / OAuth app | Webex Integration |
| Join mechanism | Meeting SDK (Linux, headless) | Graph Communications API (`calls.JoinGroupCall.All`, app-hosted media) | No public media API → headless WebRTC participant, or Meet Media API (preview, allowlisted) | Meetings SDK or SIP dial-in (SIP interop is often the simplest reliable path) |
| Raw audio access | Local recording token; host permission required | Real-time media SDK (Windows containers) | WebRTC tracks from the headless client | SIP media server leg |
| Review / approval | App Marketplace review for production | Tenant admin consent (+ M365 certification advisable) | OAuth verification + Workspace admin approval; Media API allowlist | Cisco developer program for elevated scopes |
| Recording disclosure | Built-in banner, mandatory | Compliance-recording policies per tenant | Must announce (bot name + chat message) | Built-in notice |

## Runtime architecture (when built)

```
POST /v1/meeting-bots {meetingUrl}
   └─ MeetingBotController → provider.canHandle(url) → provider.join()
        └─ bot-worker container (per session)
             ├─ joins meeting, waits in lobby (status: waiting_for_admission)
             ├─ on admit: streams PCM → chunk encoder (Opus 32k)
             ├─ chunks → POST /v1/uploads/sessions/... (same path as clients)
             └─ on meeting end / leave: complete session → transcription job
```

Sessions are tracked in a `bot_sessions` table (to be added in migration
0002) with the `BotSessionStatus` lifecycle from `meeting-bot.interface.ts`.

## Open questions for phase 2

- Hosting: one container per active bot (simple, isolatable) vs. multiplexed
  media server (cheaper at scale). Start with per-session containers.
- Meet: re-evaluate the Media API preview allowlist before investing in the
  headless-browser fallback, which is brittle against UI changes.
- Billing: bot-minutes are the cost driver; meter per session from day one.
