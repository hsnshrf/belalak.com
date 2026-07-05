import { Injectable } from "@nestjs/common";
import type { SearchRequest, SearchResult, TranscriptSegment } from "@voicevault/shared";
import { DbService } from "../db/db.service";
import { locateMatches } from "./match-locator";

/**
 * Server-side search: Postgres tsvector ('simple' config — multilingual, no
 * stemming) ranks candidate recordings across transcript text, titles, tags
 * and speaker names; match-locator then pins each hit to its audio timestamp.
 */
@Injectable()
export class SearchService {
  constructor(private readonly db: DbService) {}

  async search(userId: string, req: SearchRequest): Promise<{ results: SearchResult[]; total: number }> {
    const { sql, params } = buildSearchQuery(userId, req);
    const { rows } = await this.db.query<CandidateRow>(sql, params);
    const total = rows.length > 0 ? Number(rows[0]!.total) : 0;

    const results: SearchResult[] = rows.map((row) => {
      const segments = (row.segments ?? []) as TranscriptSegment[];
      let matches = locateMatches(segments, req.q);
      if (matches.length === 0) {
        // Hit came from title/tag/speaker, not transcript body.
        matches = [{ timeSeconds: null, segmentId: null, snippetHtml: matchedFieldSnippet(row, req.q) }];
      }
      return {
        recordingId: row.id,
        title: row.title,
        recordedAt: row.recorded_at.toISOString(),
        language: row.language_dominant,
        durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
        matches,
      };
    });
    return { results, total };
  }
}

interface CandidateRow {
  id: string;
  title: string;
  recorded_at: Date;
  language_dominant: string | null;
  duration_seconds: string | null;
  segments: unknown;
  tag_names: string[] | null;
  speaker_names: string[] | null;
  total: string;
}

/**
 * Exported for unit testing: assembles the ranked candidate query with all
 * filters as bound parameters (never string-interpolated user input).
 */
export function buildSearchQuery(userId: string, req: SearchRequest): { sql: string; params: unknown[] } {
  const params: unknown[] = [userId, req.q];
  const conds: string[] = [
    "r.user_id = $1",
    "r.deleted_at IS NULL",
    "r.trashed_at IS NULL",
    `(
      t.text_tsv @@ websearch_to_tsquery('simple', $2)
      OR r.title_tsv @@ websearch_to_tsquery('simple', $2)
      OR r.title ILIKE '%' || $2 || '%'
      OR EXISTS (
        SELECT 1 FROM recording_tags rt JOIN tags tg ON tg.id = rt.tag_id
        WHERE rt.recording_id = r.id AND tg.name ILIKE '%' || $2 || '%'
      )
      OR EXISTS (
        SELECT 1 FROM speakers sp WHERE sp.recording_id = r.id
        AND coalesce(sp.display_name, sp.label) ILIKE '%' || $2 || '%'
      )
    )`,
  ];
  const add = (cond: string, value: unknown) => {
    params.push(value);
    conds.push(cond.replace("?", `$${params.length}`));
  };
  if (req.dateFrom) add("r.recorded_at >= ?", req.dateFrom);
  if (req.dateTo) add("r.recorded_at <= ?", req.dateTo);
  if (req.language) add("r.language_dominant = ?", req.language);
  if (req.categoryId) add("r.category_id = ?", req.categoryId);
  if (req.folderId) add("r.folder_id = ?", req.folderId);
  if (req.sourceType) add("r.source_type = ?", req.sourceType);
  if (req.minDurationSeconds !== undefined) add("r.duration_seconds >= ?", req.minDurationSeconds);
  if (req.maxDurationSeconds !== undefined) add("r.duration_seconds <= ?", req.maxDurationSeconds);
  if (req.tagIds?.length) {
    params.push(req.tagIds);
    conds.push(
      `(SELECT count(DISTINCT rt.tag_id) FROM recording_tags rt
        WHERE rt.recording_id = r.id AND rt.tag_id = ANY($${params.length})) = ${req.tagIds.length}`,
    );
  }

  params.push(req.limit, req.offset);
  const sql = `
    SELECT r.id, r.title, r.recorded_at, r.language_dominant, r.duration_seconds,
           t.segments,
           count(*) OVER() AS total,
           ts_rank(coalesce(t.text_tsv, ''::tsvector), websearch_to_tsquery('simple', $2)) AS rank
    FROM recordings r
    LEFT JOIN transcripts t ON t.recording_id = r.id
      AND t.kind = (CASE WHEN EXISTS (
            SELECT 1 FROM transcripts e WHERE e.recording_id = r.id AND e.kind = 'edited'
          ) THEN 'edited' ELSE 'original' END)::transcript_kind
      AND t.deleted_at IS NULL
    WHERE ${conds.join(" AND ")}
    ORDER BY rank DESC, r.recorded_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}`;
  return { sql, params };
}

function matchedFieldSnippet(row: CandidateRow, q: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc(row.title);
}
