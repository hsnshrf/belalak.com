/**
 * Meeting bot (Strategy C) — PHASE 2 SCAFFOLD ONLY.
 *
 * Architecture: a server-side bot joins the meeting as a participant via the
 * platform's own API/SDK, records cloud-side, and feeds the audio into the
 * normal upload → transcription pipeline. Nothing runs on the user's device,
 * so this works regardless of OS restrictions — but each platform requires
 * app registration, OAuth grants, and (for some) a partner-program approval.
 * Per-platform requirements: docs/meeting-bot.md.
 */

export type MeetingPlatform = "zoom" | "teams" | "meet" | "webex";

export interface BotJoinRequest {
  userId: string;
  meetingUrl: string;
  /** Display name the bot uses in the participant list — transparency, not stealth. */
  botDisplayName: string;
  /** Recording the bot creates is attributed to this recording row. */
  recordingId: string;
}

export type BotSessionStatus =
  | "requested"
  | "joining"
  | "waiting_for_admission" // bot is in the lobby; host must admit it
  | "recording"
  | "leaving"
  | "done"
  | "failed";

export interface BotSession {
  id: string;
  platform: MeetingPlatform;
  status: BotSessionStatus;
  error?: string;
}

export interface MeetingBotProvider {
  readonly platform: MeetingPlatform;

  /** Can this provider parse/handle the given meeting URL? */
  canHandle(meetingUrl: string): boolean;

  /**
   * Join the meeting and start recording. Implementations must:
   *  1. Join visibly (bot named per request; platforms require disclosure).
   *  2. Respect host controls: leave immediately when removed/denied.
   *  3. Stream or chunk audio into the upload session for `recordingId`.
   */
  join(request: BotJoinRequest): Promise<BotSession>;

  status(sessionId: string): Promise<BotSession>;

  /** Stop recording and leave the meeting. */
  leave(sessionId: string): Promise<void>;
}

/** Env-driven per-platform credentials — all optional until phase 2 ships. */
export interface MeetingBotConfig {
  zoom?: { clientId: string; clientSecret: string; accountId: string; sdkKey?: string };
  teams?: { tenantId: string; clientId: string; clientSecret: string; botAppId: string };
  meet?: { serviceAccountJson: string; workspaceCustomerId: string };
  webex?: { clientId: string; clientSecret: string };
}
