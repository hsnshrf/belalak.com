import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { transcriptSegmentSchema } from "@voicevault/shared";
import { z } from "zod";
import { AuthGuard, CurrentUser, type AuthUser } from "../common/auth.guard";
import { ZodPipe } from "../common/zod.pipe";
import { DbService } from "../db/db.service";
import { TranscriptionQueue } from "./transcription.queue";

const requeueSchema = z.object({
  provider: z.enum(["whisper_api", "deepgram", "local_whisper"]).optional(),
});
const editSchema = z.object({ segments: z.array(transcriptSegmentSchema).min(1) });
const renameSchema = z.object({ displayName: z.string().min(1).max(120) });

@Controller("v1/recordings/:id")
@UseGuards(AuthGuard)
export class TranscriptionController {
  constructor(
    private readonly db: DbService,
    private readonly queue: TranscriptionQueue,
  ) {}

  @Get("transcription")
  async status(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    await this.requireOwned(user.userId, id);
    return this.queue.status(id);
  }

  @Post("transcription")
  @HttpCode(202)
  async requeue(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodPipe(requeueSchema)) body: z.infer<typeof requeueSchema>,
  ) {
    await this.requireOwned(user.userId, id);
    const jobId = await this.queue.enqueue(id, body.provider);
    return { jobId, status: "queued" };
  }

  /**
   * Save user edits. The original transcript stays immutable; edits live in a
   * separate 'edited' row (created from the original on first edit).
   */
  @Patch("transcript")
  async edit(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodPipe(editSchema)) body: z.infer<typeof editSchema>,
  ) {
    await this.requireOwned(user.userId, id);
    const text = body.segments.map((s) => s.text).join(" ").trim();
    const { rows } = await this.db.query(
      `INSERT INTO transcripts (recording_id, kind, text, language, segments, provider)
       SELECT $1, 'edited', $2, o.language, $3::jsonb, o.provider
       FROM transcripts o WHERE o.recording_id = $1 AND o.kind = 'original'
       ON CONFLICT (recording_id, kind) DO UPDATE SET
         text = EXCLUDED.text, segments = EXCLUDED.segments, version = transcripts.version + 1
       RETURNING id, recording_id AS "recordingId", kind, text, language, segments, provider,
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, text, JSON.stringify(body.segments)],
    );
    if (!rows[0]) throw new NotFoundException("No original transcript to edit yet");
    return rows[0];
  }

  @Patch("speakers/:speakerId")
  async renameSpeaker(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("speakerId", ParseUUIDPipe) speakerId: string,
    @Body(new ZodPipe(renameSchema)) body: z.infer<typeof renameSchema>,
  ) {
    await this.requireOwned(user.userId, id);
    const { rows } = await this.db.query(
      `UPDATE speakers SET display_name = $3 WHERE id = $2 AND recording_id = $1
       RETURNING id, label, display_name AS "displayName"`,
      [id, speakerId, body.displayName],
    );
    if (!rows[0]) throw new NotFoundException("Speaker not found");
    return rows[0];
  }

  private async requireOwned(userId: string, recordingId: string): Promise<void> {
    const { rowCount } = await this.db.query(
      "SELECT 1 FROM recordings WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
      [recordingId, userId],
    );
    if (rowCount === 0) throw new NotFoundException("Recording not found");
  }
}
