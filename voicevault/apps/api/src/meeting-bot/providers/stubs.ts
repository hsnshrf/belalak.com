import { Injectable, NotImplementedException } from "@nestjs/common";
import type {
  BotJoinRequest,
  BotSession,
  MeetingBotProvider,
  MeetingPlatform,
} from "../meeting-bot.interface";

/**
 * Stub implementations — interfaces compile, endpoints return 501, and each
 * stub documents exactly what shipping it requires. Full details incl.
 * approval timelines: docs/meeting-bot.md.
 */
abstract class StubProvider implements MeetingBotProvider {
  abstract readonly platform: MeetingPlatform;
  abstract readonly urlPattern: RegExp;

  canHandle(meetingUrl: string): boolean {
    return this.urlPattern.test(meetingUrl);
  }

  join(_request: BotJoinRequest): Promise<BotSession> {
    throw new NotImplementedException(
      `${this.platform} meeting bot is not implemented yet (phase 2) — see docs/meeting-bot.md`,
    );
  }

  status(_sessionId: string): Promise<BotSession> {
    throw new NotImplementedException(`${this.platform} meeting bot is not implemented yet (phase 2)`);
  }

  leave(_sessionId: string): Promise<void> {
    throw new NotImplementedException(`${this.platform} meeting bot is not implemented yet (phase 2)`);
  }
}

/**
 * TODO(phase-2) Zoom:
 *  - Server-to-Server OAuth app + Meeting SDK app (SDK key/secret).
 *  - Join via Meeting SDK for Linux in a headless container; raw-audio access
 *    requires the SDK's local recording token and host permission.
 *  - App Marketplace review required for production distribution; recording
 *    disclosure to participants is mandatory (Zoom shows a banner).
 */
@Injectable()
export class ZoomBotStub extends StubProvider {
  readonly platform = "zoom" as const;
  readonly urlPattern = /https?:\/\/([\w-]+\.)?zoom\.us\/j\//i;
}

/**
 * TODO(phase-2) Microsoft Teams:
 *  - Azure Bot registration + Graph "calls.JoinGroupCall.All" application
 *    permission with ADMIN CONSENT per tenant.
 *  - Real-time media requires the Graph Communications SDK (application-hosted
 *    media) on Windows containers, or the newer Teams AI media APIs.
 *  - Microsoft 365 certification recommended; tenant admins can block bots.
 */
@Injectable()
export class TeamsBotStub extends StubProvider {
  readonly platform = "teams" as const;
  readonly urlPattern = /https?:\/\/teams\.(microsoft|live)\.com\//i;
}

/**
 * TODO(phase-2) Google Meet:
 *  - The Meet REST API manages meetings but does NOT provide a media plane
 *    for third-party bots; the practical route is a headless-browser
 *    participant (WebRTC) with a Workspace service account, or the Meet
 *    Media API (developer preview, allowlist-only).
 *  - Workspace admin approval + OAuth verification review required.
 */
@Injectable()
export class MeetBotStub extends StubProvider {
  readonly platform = "meet" as const;
  readonly urlPattern = /https?:\/\/meet\.google\.com\//i;
}

/**
 * TODO(phase-2) Webex:
 *  - Webex Integrations (OAuth) + the Meetings XML/REST APIs; bots join via
 *    the Webex Meetings SDK or SIP dial-in (Webex supports SIP interop —
 *    often the simplest reliable path: a SIP media server dials the meeting).
 *  - Cisco developer program approval for elevated recording scopes.
 */
@Injectable()
export class WebexBotStub extends StubProvider {
  readonly platform = "webex" as const;
  readonly urlPattern = /https?:\/\/([\w-]+\.)?webex\.com\//i;
}

export const ALL_BOT_STUBS = [ZoomBotStub, TeamsBotStub, MeetBotStub, WebexBotStub];
