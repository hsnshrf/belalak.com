import { describe, expect, it } from "vitest";
import type { SearchRequest } from "@voicevault/shared";
import { buildSearchQuery } from "./search.service";

const base: SearchRequest = { q: "budget", limit: 20, offset: 0 };
const USER = "00000000-0000-4000-8000-000000000001";

describe("buildSearchQuery (transcript search indexing)", () => {
  it("searches transcripts, titles, tags and speaker names with bound params", () => {
    const { sql, params } = buildSearchQuery(USER, base);
    expect(sql).toContain("websearch_to_tsquery('simple', $2)");
    expect(sql).toContain("text_tsv @@");
    expect(sql).toContain("title_tsv @@");
    expect(sql).toContain("tags");
    expect(sql).toContain("speakers");
    expect(params[0]).toBe(USER);
    expect(params[1]).toBe("budget");
    // User input must never be interpolated into the SQL text.
    expect(sql).not.toContain("budget");
  });

  it("prefers the edited transcript when one exists", () => {
    const { sql } = buildSearchQuery(USER, base);
    expect(sql).toContain("'edited'");
    expect(sql).toContain("'original'");
  });

  it("excludes trashed and deleted recordings", () => {
    const { sql } = buildSearchQuery(USER, base);
    expect(sql).toContain("r.trashed_at IS NULL");
    expect(sql).toContain("r.deleted_at IS NULL");
  });

  it("applies every filter as its own bound parameter", () => {
    const req: SearchRequest = {
      ...base,
      dateFrom: "2026-01-01T00:00:00.000Z",
      dateTo: "2026-02-01T00:00:00.000Z",
      language: "ar",
      categoryId: "00000000-0000-4000-8000-00000000000c",
      folderId: "00000000-0000-4000-8000-00000000000f",
      sourceType: "meeting",
      minDurationSeconds: 60,
      maxDurationSeconds: 3600,
    };
    const { sql, params } = buildSearchQuery(USER, req);
    expect(sql).toContain("r.recorded_at >=");
    expect(sql).toContain("r.language_dominant =");
    expect(sql).toContain("r.source_type =");
    expect(params).toContain("ar");
    expect(params).toContain("meeting");
    expect(params).toContain(60);
    expect(params).toContain(3600);
    // limit + offset are always the trailing params
    expect(params.at(-2)).toBe(20);
    expect(params.at(-1)).toBe(0);
  });

  it("requires ALL selected tags (AND semantics)", () => {
    const tagIds = ["00000000-0000-4000-8000-0000000000a1", "00000000-0000-4000-8000-0000000000a2"];
    const { sql, params } = buildSearchQuery(USER, { ...base, tagIds });
    expect(sql).toContain("= 2");
    expect(params).toContainEqual(tagIds);
  });

  it("handles multilingual queries as plain bound text (Arabic sample)", () => {
    const { params, sql } = buildSearchQuery(USER, { ...base, q: "الميزانية" });
    expect(params[1]).toBe("الميزانية");
    expect(sql).not.toContain("الميزانية");
  });
});
