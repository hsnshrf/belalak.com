import { describe, expect, it } from "vitest";
import { mapWhisperResponse, normalizeLanguage, type WhisperVerboseResponse } from "./whisper-api.provider";

describe("mapWhisperResponse", () => {
  const sample: WhisperVerboseResponse = {
    language: "english",
    text: "Hello world. Second segment here.",
    segments: [
      { id: 0, start: 0, end: 2, text: " Hello world." },
      { id: 1, start: 2, end: 5, text: " Second segment here." },
    ],
    words: [
      { word: "Hello", start: 0.1, end: 0.5 },
      { word: "world.", start: 0.6, end: 1.1 },
      { word: "Second", start: 2.2, end: 2.6 },
      { word: "segment", start: 2.7, end: 3.2 },
      { word: "here.", start: 3.3, end: 3.8 },
    ],
  };

  it("buckets words into their segments by midpoint time", () => {
    const result = mapWhisperResponse(sample);
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]!.words.map((w) => w.w)).toEqual(["Hello", "world."]);
    expect(result.segments[1]!.words.map((w) => w.w)).toEqual(["Second", "segment", "here."]);
  });

  it("normalizes the detected language to BCP-47", () => {
    expect(mapWhisperResponse(sample).language).toBe("en");
    expect(mapWhisperResponse({ ...sample, language: "arabic" }).language).toBe("ar");
    expect(mapWhisperResponse({ ...sample, language: undefined }).language).toBeNull();
  });

  it("reports no diarization: speaker stays null and speakers list is empty", () => {
    const result = mapWhisperResponse(sample);
    expect(result.speakers).toEqual([]);
    expect(result.segments.every((s) => s.speaker === null)).toBe(true);
  });

  it("synthesizes a single segment when the API returns none", () => {
    const result = mapWhisperResponse({ language: "english", text: "just text", words: [] });
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]!.text).toBe("just text");
  });

  it("assigns boundary-straddling words to the last segment rather than dropping them", () => {
    const withTail: WhisperVerboseResponse = {
      ...sample,
      words: [...sample.words!, { word: "goodbye", start: 5.0, end: 5.4 }],
    };
    const result = mapWhisperResponse(withTail);
    const allWords = result.segments.flatMap((s) => s.words.map((w) => w.w));
    expect(allWords).toContain("goodbye");
  });
});

describe("normalizeLanguage", () => {
  it("maps whisper names to codes and passes through short codes", () => {
    expect(normalizeLanguage("farsi")).toBe("fa");
    expect(normalizeLanguage("urdu")).toBe("ur");
    expect(normalizeLanguage("zh")).toBe("zh");
    expect(normalizeLanguage(undefined)).toBeNull();
  });
});
