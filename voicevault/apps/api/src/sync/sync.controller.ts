import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { AuthGuard, CurrentUser, type AuthUser } from "../common/auth.guard";
import { ZodPipe } from "../common/zod.pipe";
import { SyncService, type SyncRowDto } from "./sync.service";

const pushSchema = z.object({
  deviceId: z.string().min(1).max(120),
  rows: z
    .array(
      z.object({
        id: z.string().uuid(),
        entity: z.enum(["recording", "folder", "tag"]),
        updatedAt: z.string().datetime({ offset: true }),
        version: z.number().int().nonnegative(),
        deletedAt: z.string().datetime({ offset: true }).nullable(),
        payload: z.record(z.unknown()).default({}),
      }),
    )
    .max(500),
});

const pullSchema = z.object({
  deviceId: z.string().min(1).max(120),
  since: z.coerce.number().int().nonnegative().default(0),
});

@Controller("v1/sync")
@UseGuards(AuthGuard)
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post("push")
  @HttpCode(200)
  push(@CurrentUser() user: AuthUser, @Body(new ZodPipe(pushSchema)) body: z.infer<typeof pushSchema>) {
    return this.sync.push(user.userId, body.deviceId, body.rows as SyncRowDto[]);
  }

  @Get("pull")
  pull(@CurrentUser() user: AuthUser, @Query(new ZodPipe(pullSchema)) q: z.infer<typeof pullSchema>) {
    return this.sync.pull(user.userId, q.deviceId, q.since);
  }
}
