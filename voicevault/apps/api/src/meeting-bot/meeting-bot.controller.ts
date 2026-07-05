import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { AuthGuard, CurrentUser, type AuthUser } from "../common/auth.guard";
import { ZodPipe } from "../common/zod.pipe";
import type { MeetingBotProvider } from "./meeting-bot.interface";
import { MeetBotStub, TeamsBotStub, WebexBotStub, ZoomBotStub } from "./providers/stubs";

const requestSchema = z.object({ meetingUrl: z.string().url() });

/**
 * Phase-2 scaffold: routes exist so clients can integrate against the final
 * contract, but every provider currently returns 501 with a docs pointer.
 */
@Controller("v1/meeting-bots")
@UseGuards(AuthGuard)
export class MeetingBotController {
  private readonly providers: MeetingBotProvider[];

  constructor(zoom: ZoomBotStub, teams: TeamsBotStub, meet: MeetBotStub, webex: WebexBotStub) {
    this.providers = [zoom, teams, meet, webex];
  }

  @Post()
  async requestBot(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(requestSchema)) body: z.infer<typeof requestSchema>,
  ) {
    const provider = this.providers.find((p) => p.canHandle(body.meetingUrl));
    if (!provider) {
      return {
        supported: false,
        message: "Unrecognized meeting URL. Supported platforms: Zoom, Teams, Google Meet, Webex.",
      };
    }
    // Throws 501 NotImplemented with a docs pointer — scaffold only.
    await provider.join({
      userId: user.userId,
      meetingUrl: body.meetingUrl,
      botDisplayName: "VoiceVault Notetaker",
      recordingId: "", // assigned when phase 2 wires the upload pipeline
    });
  }
}
