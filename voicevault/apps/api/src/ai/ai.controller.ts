import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { AI_ARTIFACT_KINDS, type AiArtifactKind } from "@voicevault/shared";
import { z } from "zod";
import { AuthGuard, CurrentUser, type AuthUser } from "../common/auth.guard";
import { ZodPipe } from "../common/zod.pipe";
import { AiService } from "./ai.service";

const kindSchema = z.enum(AI_ARTIFACT_KINDS);

@Controller("v1/recordings/:id/ai")
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  /**
   * Generate summary / action_items / key_topics / tag_suggestions /
   * category_suggestion on demand. Suggestions are returned for the user to
   * confirm — the server never silently applies them.
   */
  @Post(":kind")
  generate(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("kind", new ZodPipe(kindSchema)) kind: AiArtifactKind,
  ) {
    return this.ai.generate(user.userId, id, kind);
  }
}
