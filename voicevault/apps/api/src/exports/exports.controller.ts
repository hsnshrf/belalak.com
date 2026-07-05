import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { exportRequestSchema, type TranscriptSegment } from "@voicevault/shared";
import { createHash, randomBytes } from "node:crypto";
import type { z } from "zod";
import { AuthGuard, CurrentUser, type AuthUser } from "../common/auth.guard";
import { ZodPipe } from "../common/zod.pipe";
import { config } from "../config";
import { DbService } from "../db/db.service";
import { StorageService } from "../storage/storage.service";
import { pdfCanRender, toDocx, toPdf, toSrt, toTxt, type SpeakerNames } from "./formatters";

const MIME: Record<string, string> = {
  txt: "text/plain; charset=utf-8",
  srt: "application/x-subrip; charset=utf-8",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

@Controller()
export class ExportsController {
  constructor(
    private readonly db: DbService,
    private readonly storage: StorageService,
  ) {}

  @Post("v1/recordings/:id/export")
  @UseGuards(AuthGuard)
  async export(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodPipe(exportRequestSchema)) body: z.infer<typeof exportRequestSchema>,
    @Res() res: Response,
  ) {
    const data = await this.loadTranscript(user.userId, id, body.transcriptKind);
    const { title, language, segments, names } = data;

    let payload: Buffer;
    switch (body.format) {
      case "txt":
        payload = Buffer.from(toTxt(title, segments, names), "utf8");
        break;
      case "srt":
        payload = Buffer.from(toSrt(segments, names), "utf8");
        break;
      case "docx":
        payload = await toDocx(title, segments, language, names);
        break;
      case "pdf": {
        const fullText = segments.map((s) => s.text).join(" ");
        if (!pdfCanRender(`${title} ${fullText}`)) {
          // Honest limitation: the minimal PDF writer has no font embedding /
          // Arabic shaping yet. DOCX is lossless for all scripts.
          throw new BadRequestException(
            "PDF export currently supports Latin scripts only — use DOCX for this recording (full Unicode).",
          );
        }
        payload = toPdf(title, segments, names);
        break;
      }
    }

    const safeName = title.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 60) || "transcript";
    res
      .status(200)
      .setHeader("content-type", MIME[body.format]!)
      .setHeader(
        "content-disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(`${safeName}.${body.format}`)}`,
      )
      .send(payload);
  }

  /** Expiring signed share link: audio + transcript, no account needed. */
  @Post("v1/recordings/:id/share-link")
  @UseGuards(AuthGuard)
  async createShareLink(@CurrentUser() user: AuthUser, @Param("id", ParseUUIDPipe) id: string) {
    await this.loadTranscript(user.userId, id, "edited"); // ownership check
    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await this.db.query(
      "INSERT INTO share_links (recording_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [id, sha256(token), expiresAt.toISOString()],
    );
    return { url: `${config().API_BASE_URL}/v1/shared/${token}`, expiresAt: expiresAt.toISOString() };
  }

  /** Public share endpoint (token-authenticated, time-limited). */
  @Get("v1/shared/:token")
  async openShared(@Param("token") token: string) {
    const { rows } = await this.db.query<{ recording_id: string; expires_at: Date }>(
      "SELECT recording_id, expires_at FROM share_links WHERE token_hash = $1",
      [sha256(token)],
    );
    const link = rows[0];
    if (!link || link.expires_at.getTime() < Date.now()) {
      throw new NotFoundException("This share link has expired or does not exist");
    }
    const rec = await this.db.query<{
      title: string;
      audio_original_key: string | null;
      language_dominant: string | null;
    }>("SELECT title, audio_original_key, language_dominant FROM recordings WHERE id = $1 AND deleted_at IS NULL", [
      link.recording_id,
    ]);
    if (!rec.rows[0]) throw new NotFoundException("Recording no longer exists");
    const t = await this.db.query<{ text: string; segments: unknown }>(
      `SELECT text, segments FROM transcripts WHERE recording_id = $1 AND deleted_at IS NULL
       ORDER BY (kind = 'edited') DESC LIMIT 1`,
      [link.recording_id],
    );
    const audioUrl = rec.rows[0].audio_original_key
      ? await this.storage.signedGetUrl(rec.rows[0].audio_original_key)
      : null;
    return {
      title: rec.rows[0].title,
      language: rec.rows[0].language_dominant,
      audioUrl,
      transcript: t.rows[0] ?? null,
      expiresAt: link.expires_at,
    };
  }

  private async loadTranscript(userId: string, recordingId: string, kind: "original" | "edited") {
    const rec = await this.db.query<{ title: string; language_dominant: string | null }>(
      "SELECT title, language_dominant FROM recordings WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
      [recordingId, userId],
    );
    if (!rec.rows[0]) throw new NotFoundException("Recording not found");
    // Prefer the requested kind, fall back to the other.
    const t = await this.db.query<{ segments: unknown; language: string | null }>(
      `SELECT segments, language FROM transcripts WHERE recording_id = $1 AND deleted_at IS NULL
       ORDER BY (kind = $2) DESC LIMIT 1`,
      [recordingId, kind],
    );
    if (!t.rows[0]) throw new NotFoundException("No transcript to export yet");
    const speakers = await this.db.query<{ label: string; display_name: string | null }>(
      "SELECT label, display_name FROM speakers WHERE recording_id = $1",
      [recordingId],
    );
    const names: SpeakerNames = {};
    for (const s of speakers.rows) if (s.display_name) names[s.label] = s.display_name;
    return {
      title: rec.rows[0].title,
      language: t.rows[0].language ?? rec.rows[0].language_dominant,
      segments: t.rows[0].segments as TranscriptSegment[],
      names,
    };
  }
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
