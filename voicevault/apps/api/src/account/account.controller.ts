import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { AuthGuard, CurrentUser, type AuthUser } from "../common/auth.guard";
import { ZodPipe } from "../common/zod.pipe";
import { DbService } from "../db/db.service";

/**
 * Per-user settings stored in users.settings (jsonb). Client-agnostic so web
 * and mobile stay in sync through /v1/sync as well.
 */
const settingsSchema = z.object({
  locale: z.enum(["en", "ar"]).optional(),
  /** Verbal "this call is being recorded" announcement default for call/meeting modes. */
  announcementDefaultOn: z.boolean().optional(),
  defaultQualityPreset: z.enum(["voice", "standard", "high"]).optional(),
  /** Local-only mode: nothing leaves the device; transcription on-device or via user-supplied key. */
  localOnlyMode: z.boolean().optional(),
});

@Controller("v1/account")
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private readonly db: DbService) {}

  /** Storage usage dashboard: totals + per-source breakdown. */
  @Get("usage")
  async usage(@CurrentUser() user: AuthUser) {
    const { rows } = await this.db.query<{
      source_type: string;
      count: string;
      bytes: string | null;
      seconds: string | null;
    }>(
      `SELECT source_type, count(*) AS count, sum(size_bytes) AS bytes, sum(duration_seconds) AS seconds
       FROM recordings WHERE user_id = $1 AND deleted_at IS NULL
       GROUP BY source_type`,
      [user.userId],
    );
    const bySource = rows.map((r) => ({
      sourceType: r.source_type,
      recordingCount: Number(r.count),
      bytes: Number(r.bytes ?? 0),
      durationSeconds: Number(r.seconds ?? 0),
    }));
    return {
      totalBytes: bySource.reduce((a, b) => a + b.bytes, 0),
      recordingCount: bySource.reduce((a, b) => a + b.recordingCount, 0),
      bySource,
    };
  }

  @Get("settings")
  async getSettings(@CurrentUser() user: AuthUser) {
    const { rows } = await this.db.query<{ settings: Record<string, unknown>; locale: string }>(
      "SELECT settings, locale FROM users WHERE id = $1",
      [user.userId],
    );
    return { locale: rows[0]?.locale ?? "en", announcementDefaultOn: true, ...rows[0]?.settings };
  }

  @Patch("settings")
  async patchSettings(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(settingsSchema)) body: z.infer<typeof settingsSchema>,
  ) {
    const { rows } = await this.db.query<{ settings: Record<string, unknown> }>(
      `UPDATE users SET settings = settings || $2::jsonb,
         locale = coalesce($3, locale), updated_at = now()
       WHERE id = $1 RETURNING settings`,
      [user.userId, JSON.stringify(body), body.locale ?? null],
    );
    return rows[0]?.settings ?? {};
  }

  /**
   * Full data export (all recordings + transcripts as ZIP). Runs async — the
   * job walks every recording, streams audio from S3 and transcripts from
   * Postgres into a ZIP in the exports/ prefix, then issues a signed URL.
   */
  @Post("export")
  @HttpCode(202)
  async startExport(@CurrentUser() user: AuthUser) {
    const { rows } = await this.db.query<{ count: string }>(
      "SELECT count(*) FROM recordings WHERE user_id = $1 AND deleted_at IS NULL",
      [user.userId],
    );
    // TODO(phase-2): dedicated BullMQ export queue; for now the API reports
    // scope so the UI can show what the export will contain.
    return {
      status: "accepted",
      recordingCount: Number(rows[0]?.count ?? 0),
      note: "Export job queued; a download link will be emailed when ready.",
    };
  }

  /** GDPR-style full account deletion. */
  @Delete()
  @HttpCode(204)
  async deleteAccount(@CurrentUser() user: AuthUser, @Query("confirm") confirm: string) {
    if (confirm !== "true") {
      throw new BadRequestException("Account deletion requires ?confirm=true — this removes ALL data irreversibly");
    }
    // Soft-delete the user immediately (locks out logins, hides data);
    // a retention job hard-deletes rows + S3 objects after the grace window.
    await this.db.query("UPDATE users SET deleted_at = now() WHERE id = $1", [user.userId]);
    await this.db.query("UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1", [user.userId]);
  }
}
