import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import type { AiArtifactKind } from "@voicevault/shared";
import { config } from "../config";
import { DbService } from "../db/db.service";

/**
 * On-demand AI post-processing over transcripts: summaries, action items,
 * key topics, and tag/category suggestions. Every artifact is generated when
 * the user asks and STORED for the recording; suggestions are never
 * auto-applied — the client shows them for explicit confirmation.
 */
@Injectable()
export class AiService {
  constructor(private readonly db: DbService) {}

  async generate(userId: string, recordingId: string, kind: AiArtifactKind) {
    const { rows } = await this.db.query<{ text: string; language: string | null; title: string }>(
      `SELECT t.text, t.language, r.title FROM transcripts t
       JOIN recordings r ON r.id = t.recording_id
       WHERE t.recording_id = $1 AND r.user_id = $2 AND t.deleted_at IS NULL
       ORDER BY (t.kind = 'edited') DESC LIMIT 1`,
      [recordingId, userId],
    );
    const transcript = rows[0];
    if (!transcript) throw new NotFoundException("No transcript available yet for this recording");

    const existingTags = await this.db.query<{ name: string }>(
      "SELECT name FROM tags WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name LIMIT 100",
      [userId],
    );
    const categories = await this.db.query<{ name: string }>(
      "SELECT name FROM categories WHERE user_id = $1 ORDER BY name",
      [userId],
    );

    const content = await this.callModel(kind, {
      transcript: transcript.text,
      language: transcript.language,
      title: transcript.title,
      existingTags: existingTags.rows.map((t) => t.name),
      categories: categories.rows.map((c) => c.name),
    });

    const { rows: saved } = await this.db.query(
      `INSERT INTO ai_artifacts (recording_id, kind, content, model)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING id, recording_id AS "recordingId", kind, content, model, created_at AS "createdAt"`,
      [recordingId, kind, JSON.stringify(content), config().ANTHROPIC_MODEL],
    );
    return saved[0];
  }

  private async callModel(
    kind: AiArtifactKind,
    ctx: {
      transcript: string;
      language: string | null;
      title: string;
      existingTags: string[];
      categories: string[];
    },
  ): Promise<unknown> {
    const cfg = config();
    if (!cfg.ANTHROPIC_API_KEY) {
      throw new ServiceUnavailableException(
        "AI features need ANTHROPIC_API_KEY configured on the server",
      );
    }
    // Long recordings: send the head+tail; enough for summaries/suggestions
    // without blowing the context budget on 6-hour transcripts.
    const text =
      ctx.transcript.length > 60_000
        ? `${ctx.transcript.slice(0, 40_000)}\n[...]\n${ctx.transcript.slice(-15_000)}`
        : ctx.transcript;

    const prompts: Record<AiArtifactKind, string> = {
      summary:
        "Summarize this conversation transcript in 4-8 sentences. Respond in the transcript's own language. " +
        'Return JSON: {"summary": string}',
      action_items:
        "Extract concrete action items (who/what/when if stated). " +
        'Return JSON: {"actionItems": [{"text": string, "owner": string|null, "due": string|null}]}',
      key_topics:
        'List 3-8 key topics discussed. Return JSON: {"topics": [string]}',
      tag_suggestions:
        `Suggest up to 5 short tags for this recording. Prefer reusing the user's existing tags when they fit: ` +
        `${JSON.stringify(ctx.existingTags.slice(0, 50))}. ` +
        'Return JSON: {"tags": [string]}',
      category_suggestion:
        `Pick the single best category from exactly this list: ${JSON.stringify(ctx.categories)}. ` +
        'Return JSON: {"category": string}',
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": cfg.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.ANTHROPIC_MODEL,
        max_tokens: 1024,
        system:
          "You analyze conversation transcripts. Reply with ONLY the requested JSON object — no prose, no code fences.",
        messages: [
          {
            role: "user",
            content: `${prompts[kind]}\n\nTitle: ${ctx.title}\nTranscript:\n${text}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ServiceUnavailableException(`AI request failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    const body = (await res.json()) as { content: { type: string; text?: string }[] };
    const textOut = body.content.find((c) => c.type === "text")?.text ?? "{}";
    try {
      return JSON.parse(textOut);
    } catch {
      // Model wrapped the JSON — salvage the first JSON object in the output.
      const match = textOut.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new ServiceUnavailableException("AI returned unparseable output; try again");
    }
  }
}
