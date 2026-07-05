import { describe, expect, it } from "vitest";
import type { TranscriptSegment } from "@voicevault/shared";
import { locateMatches, normalizeToken } from "./match-locator";

function seg(id: string, startAt: number, text: string): TranscriptSegment {
  const words = text.split(" ").map((w, i) => ({ w, s: startAt + i, e: startAt + i + 0.9 }));
  return { id, start: startAt, end: startAt + words.length, speaker: null, language: null, text, words };
}

describe("normalizeToken", () => {
  it("lower-cases and strips edge punctuation", () => {
    expect(normalizeToken("Hello,")).toBe("hello");
    expect(normalizeToken("(budget)")).toBe("budget");
  });

  it("strips Arabic diacritics and tatweel so vowelled text matches plain queries", () => {
    expect(normalizeToken("مَرْحَبًا")).toBe(normalizeToken("مرحبا"));
    expect(normalizeToken("مـــرحبا")).toBe("مرحبا");
  });
});

describe("locateMatches → exact audio timestamps", () => {
  const segments = [
    seg("s1", 0, "Welcome everyone to the quarterly budget review meeting"),
    seg("s2", 100, "The budget for marketing doubled, said Sara"),
    seg("s3", 200, "لنتحدث عن الميزانية الجديدة اليوم"),
  ];

  it("returns the start time of the matched word", () => {
    const hits = locateMatches(segments, "budget");
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({ segmentId: "s1", timeSeconds: 5 });
    expect(hits[1]).toMatchObject({ segmentId: "s2", timeSeconds: 101 });
  });

  it("wraps matched words in <mark> within the snippet", () => {
    const [hit] = locateMatches(segments, "budget");
    expect(hit!.snippetHtml).toContain("<mark>budget</mark>");
    expect(hit!.snippetHtml).not.toContain("<mark>meeting</mark>");
  });

  it("matches case-insensitively and through punctuation", () => {
    const hits = locateMatches(segments, "SARA");
    expect(hits).toHaveLength(1);
    // "Sara" is the 7th word (index 6) of s2 → 106s
    expect(hits[0]!.timeSeconds).toBe(106);
  });

  it("matches multi-word phrases only when consecutive", () => {
    expect(locateMatches(segments, "budget review")).toHaveLength(1);
    expect(locateMatches(segments, "budget meeting")).toHaveLength(0);
    const [hit] = locateMatches(segments, "budget review");
    expect(hit!.timeSeconds).toBe(5);
  });

  it("finds Arabic words regardless of diacritics in query or text", () => {
    const hits = locateMatches(segments, "الميزانيَة");
    expect(hits).toHaveLength(1);
    expect(hits[0]!.segmentId).toBe("s3");
    expect(hits[0]!.timeSeconds).toBe(202);
  });

  it("escapes HTML in transcript words (no XSS through snippets)", () => {
    const nasty = [seg("x", 0, "click <script>alert(1)</script> now")];
    const hits = locateMatches(nasty, "click");
    expect(hits[0]!.snippetHtml).not.toContain("<script>");
    expect(hits[0]!.snippetHtml).toContain("&lt;script&gt;");
  });

  it("falls back to segment text when word timings are missing", () => {
    const noWords: TranscriptSegment = {
      id: "edited",
      start: 42,
      end: 50,
      speaker: null,
      language: null,
      text: "manually corrected budget line",
      words: [],
    };
    const hits = locateMatches([noWords], "budget");
    expect(hits).toHaveLength(1);
    expect(hits[0]!.timeSeconds).toBe(42); // segment start as best-effort seek
  });

  it("caps matches at maxMatches", () => {
    const many = Array.from({ length: 30 }, (_, i) => seg(`m${i}`, i * 10, "budget talk"));
    expect(locateMatches(many, "budget", { maxMatches: 5 })).toHaveLength(5);
  });
});
