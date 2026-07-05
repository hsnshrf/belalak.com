import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { createRecordingSchema } from "@voicevault/shared";
import { z } from "zod";
import { AuthGuard, CurrentUser, type AuthUser } from "../common/auth.guard";
import { ZodPipe } from "../common/zod.pipe";
import { RecordingsService, type LibraryView } from "./recordings.service";

const listQuerySchema = z.object({
  view: z.enum(["all", "favorites", "archived", "trash"]).default("all"),
  folderId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  folderId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  isFavorite: z.boolean().optional(),
  archived: z.boolean().optional(),
});

@Controller("v1/recordings")
@UseGuards(AuthGuard)
export class RecordingsController {
  constructor(private readonly recordings: RecordingsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query(new ZodPipe(listQuerySchema)) q: z.infer<typeof listQuerySchema>) {
    return this.recordings.list(user.userId, { ...q, view: q.view as LibraryView });
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(createRecordingSchema)) body: z.infer<typeof createRecordingSchema>,
  ) {
    return this.recordings.create(user.userId, body);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.recordings.getDetail(user.userId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodPipe(updateSchema)) body: z.infer<typeof updateSchema>,
  ) {
    return this.recordings.update(user.userId, id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  async trash(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    await this.recordings.trash(user.userId, id);
  }

  @Post(":id/restore")
  restore(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.recordings.restore(user.userId, id);
  }

  @Delete(":id/purge")
  @HttpCode(204)
  async purge(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("confirm") confirm: string,
  ) {
    if (confirm !== "true") {
      throw new BadRequestException("Permanent deletion requires ?confirm=true — this cannot be undone");
    }
    await this.recordings.purge(user.userId, id);
  }
}
