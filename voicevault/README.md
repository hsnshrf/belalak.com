# VoiceVault

Cross-platform recording, transcription & search: record conversations and
meetings, transcribe them with automatic language detection (multilingual,
including RTL scripts), and full-text-search every word — tapping a search hit
seeks the audio to that exact moment.

## Monorepo layout

```
voicevault/
├── apps/
│   ├── api/        NestJS backend: auth, chunked uploads, S3 storage,
│   │               BullMQ transcription queue, search, exports
│   ├── web/        Next.js (App Router) web app: mic + tab-audio capture,
│   │               playback with synced transcript, search UI
│   └── mobile/     Flutter app (iOS + Android): background recording,
│   │               offline-first SQLite (Drift) + FTS5, sync
├── packages/
│   └── shared/     Zod schemas / TS types, constants, sync merge logic,
│                   and the OpenAPI contract (openapi/voicevault.openapi.yaml)
├── infra/          docker-compose for local Postgres + Redis + MinIO
├── docs/           Platform constraints, consent, meeting-bot design
└── Makefile        `make check` = lint + typecheck + tests everywhere
```

**Contract-first:** `packages/shared/openapi/voicevault.openapi.yaml` and the
zod schemas in `packages/shared/src/schemas.ts` are the source of truth; the
API implements them and both clients consume them.

## Quick start

```bash
cp .env.example .env          # fill in provider keys (see comments inside)
make dev-infra                # Postgres + Redis + MinIO via docker compose
npm install
npm run migrate --workspace apps/api
npm run dev --workspace apps/api      # http://localhost:4000
npm run dev --workspace apps/web      # http://localhost:3000
cd apps/mobile && flutter run         # requires Flutter SDK
```

## Quality gates

```bash
make check        # lint + typecheck + unit tests (JS workspaces + Flutter)
```

Flutter checks are skipped with a warning when the Flutter SDK is not
installed (e.g. minimal CI containers).

## Honest platform constraints

This product does **not** fake capabilities that platforms don't allow:

- No in-app interception of Zoom/Teams/Meet/Webex audio on mobile — that is
  not possible via public APIs. See `docs/meeting-capture.md`.
- No cellular call recording on iOS; Android `VOICE_CALL` capture is used only
  where the OEM permits it and fails gracefully otherwise.
  See `docs/call-recording-constraints.md`.
- Consent reminders and per-recording consent acknowledgment are built in.
  See `docs/consent.md`.

Per-app setup details live in each app's own `README.md`.
