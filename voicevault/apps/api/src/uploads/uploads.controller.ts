import {
  Body,
  Controller,
  Headers,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { openUploadSessionSchema } from "@voicevault/shared";
import type { z } from "zod";
import { AuthGuard, CurrentUser, type AuthUser } from "../common/auth.guard";
import { ZodPipe } from "../common/zod.pipe";
import { UploadsService } from "./uploads.service";

@Controller("v1/uploads")
@UseGuards(AuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post("sessions")
  openSession(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(openUploadSessionSchema)) body: z.infer<typeof openUploadSessionSchema>,
  ) {
    return this.uploads.openSession(user.userId, body);
  }

  @Put("sessions/:sessionId/chunks/:seq")
  async putChunk(
    @CurrentUser() user: AuthUser,
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Param("seq", ParseIntPipe) seq: number,
    @Headers("x-chunk-sha256") sha256: string,
    @Headers("x-chunk-is-last") isLast: string | undefined,
    @Req() req: Request,
  ) {
    // Raw body: main.ts registers express.raw() for this route.
    const body = req.body as Buffer;
    return this.uploads.putChunk(user.userId, sessionId, seq, body, sha256 ?? "", isLast === "true");
  }

  @Post("sessions/:sessionId/complete")
  complete(@CurrentUser() user: AuthUser, @Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.uploads.complete(user.userId, sessionId);
  }
}
