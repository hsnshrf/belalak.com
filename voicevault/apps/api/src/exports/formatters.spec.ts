import { describe, expect, it } from "vitest";
import type { TranscriptSegment } from "@voicevault/shared";
import { pdfCanRender, srtTimestamp, toDocx, toPdf, toSrt, toTxt } from "./formatters";

const seg = (id: string, start: number, end: number, text: string, speaker: string | null = null): TranscriptSegment => ({
  id,
  start,
  end,
  speaker,
  language: null,
  text,
  words: [],
});

describe("srtTimestamp", () => {
  it("formats HH:MM:SS,mmm", () => {
    expect(srtTimestamp(0)).toBe("00:00:00,000");
    expect(srtTimestamp(61.5)).toBe("00:01:01,500");
    expect(srtTimestamp(3723.042)).toBe("01:02:03,042");
  });
});

describe("toSrt", () => {
  it("produces numbered cues with speaker prefixes", () => {
    const srt = toSrt(
      [seg("a", 0, 2.5, "Hello there.", "S1"), seg("b", 2.5, 5, "Hi!", "S2")],
      { S2: "Sara" },
    );
    expect(srt).toBe(
      [
        "1",
        "00:00:00,000 --> 00:00:02,500",
        "Speaker 1: Hello there.",
        "",
        "2",
        "00:00:02,500 --> 00:00:05,000",
        "Sara: Hi!",
        "",
      ].join("\n"),
    );
  });
});

describe("toTxt", () => {
  it("groups consecutive segments under one speaker heading", () => {
    const txt = toTxt("My call", [
      seg("a", 0, 1, "First.", "S1"),
      seg("b", 1, 2, "Second.", "S1"),
      seg("c", 2, 3, "Reply.", "S2"),
    ]);
    expect(txt).toContain("My call");
    expect(txt.match(/Speaker 1:/g)).toHaveLength(1);
    expect(txt).toContain("Speaker 2:");
    expect(txt.indexOf("First.")).toBeLessThan(txt.indexOf("Reply."));
  });
});

describe("toDocx", () => {
  it("produces a zip container with the transcript text (unicode-safe)", async () => {
    const buf = await toDocx("عنوان", [seg("a", 0, 1, "مرحبا بالعالم")], "ar");
    // ZIP magic
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buf);
    const doc = await zip.file("word/document.xml")!.async("string");
    expect(doc).toContain("مرحبا بالعالم");
    expect(doc).toContain("<w:bidi/>"); // RTL paragraph props for Arabic
  });

  it("escapes XML-hostile transcript text", async () => {
    const buf = await toDocx("t", [seg("a", 0, 1, 'x < y & "z"')], "en");
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buf);
    const doc = await zip.file("word/document.xml")!.async("string");
    expect(doc).toContain("x &lt; y &amp;");
  });
});

describe("toPdf", () => {
  it("emits a structurally valid PDF for Latin text", () => {
    const buf = toPdf("Title", [seg("a", 0, 1, "Hello world", "S1")]);
    const s = buf.toString("latin1");
    expect(s.startsWith("%PDF-1.4")).toBe(true);
    expect(s).toContain("(Hello world) Tj");
    expect(s.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("pdfCanRender is honest about non-Latin scripts", () => {
    expect(pdfCanRender("Hello, café")).toBe(true);
    expect(pdfCanRender("مرحبا")).toBe(false);
    expect(pdfCanRender("你好")).toBe(false);
  });
});
