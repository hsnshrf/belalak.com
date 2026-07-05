import { describe, expect, it } from "vitest";
import { mapDeepgramResponse, type DeepgramResponse } from "./deepgram.provider";

describe("mapDeepgramResponse", () => {
  const sample: DeepgramResponse = {
    results: {
      channels: [{ detected_language: "ar", alternatives: [{ transcript: "" }] }],
      utterances: [
        {
          start: 0.2,
          end: 3.1,
          transcript: "مرحبا بالجميع",
          speaker: 0,
          words: [
            { word: "مرحبا", start: 0.2, end: 0.9 },
            { word: "بالجميع", start: 1.0, end: 1.8 },
          ],
        },
        {
          start: 3.5,
          end: 5.0,
          transcript: "أهلا",
          speaker: 1,
          words: [{ word: "أهلا", start: 3.5, end: 4.0, punctuated_word: "أهلاً!" }],
        },
      ],
    },
  };

  it("maps utterances to segments with diarized speaker keys", () => {
    const result = mapDeepgramResponse(sample);
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0]!.speaker).toBe("S1");
    expect(result.segments[1]!.speaker).toBe("S2");
    expect(result.speakers).toEqual(["S1", "S2"]);
  });

  it("carries detected language and word timestamps", () => {
    const result = mapDeepgramResponse(sample);
    expect(result.language).toBe("ar");
    expect(result.segments[0]!.words[0]).toEqual({ w: "مرحبا", s: 0.2, e: 0.9 });
  });

  it("prefers punctuated words when present", () => {
    const result = mapDeepgramResponse(sample);
    expect(result.segments[1]!.words[0]!.w).toBe("أهلاً!");
  });

  it("falls back to one flat segment without utterances (no diarization claimed)", () => {
    const flat: DeepgramResponse = {
      results: {
        channels: [
          {
            detected_language: "en",
            alternatives: [
              {
                transcript: "hello world",
                words: [
                  { word: "hello", start: 0, end: 0.4 },
                  { word: "world", start: 0.5, end: 0.9 },
                ],
              },
            ],
          },
        ],
      },
    };
    const result = mapDeepgramResponse(flat);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]!.speaker).toBeNull();
    expect(result.speakers).toEqual([]);
    expect(result.text).toBe("hello world");
  });
});
