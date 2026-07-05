import JSZip from "jszip";
import type { TranscriptSegment } from "@voicevault/shared";

/**
 * Transcript export formatters. TXT/SRT/DOCX are fully Unicode-safe (Arabic,
 * Farsi, CJK…). The minimal PDF writer supports Latin-1 text only — for
 * non-Latin scripts the API steers clients to DOCX (see exports.controller);
 * proper Arabic PDF needs font embedding + shaping (phase-2 TODO).
 */

export interface SpeakerNames {
  [label: string]: string; // "S1" → "Sara"
}

const speakerDisplay = (label: string | null, names: SpeakerNames): string | null => {
  if (!label) return null;
  if (names[label]) return names[label];
  const n = label.replace(/\D/g, "");
  return n ? `Speaker ${n}` : label;
};

// ── TXT ───────────────────────────────────────────────────────────────────────

export function toTxt(title: string, segments: TranscriptSegment[], names: SpeakerNames = {}): string {
  const lines: string[] = [title, "=".repeat(Math.min(title.length, 80)), ""];
  let lastSpeaker: string | null = null;
  for (const seg of segments) {
    const speaker = speakerDisplay(seg.speaker, names);
    if (speaker && speaker !== lastSpeaker) {
      lines.push("", `${speaker}:`);
      lastSpeaker = speaker;
    }
    lines.push(seg.text);
  }
  return lines.join("\n") + "\n";
}

// ── SRT ───────────────────────────────────────────────────────────────────────

export function srtTimestamp(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const rem = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(rem, 3)}`;
}

export function toSrt(segments: TranscriptSegment[], names: SpeakerNames = {}): string {
  const cues: string[] = [];
  segments.forEach((seg, i) => {
    const speaker = speakerDisplay(seg.speaker, names);
    const text = speaker ? `${speaker}: ${seg.text}` : seg.text;
    cues.push(`${i + 1}`, `${srtTimestamp(seg.start)} --> ${srtTimestamp(seg.end)}`, text, "");
  });
  return cues.join("\n");
}

// ── DOCX ──────────────────────────────────────────────────────────────────────

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Minimal but valid OOXML document: one heading + one paragraph per segment,
 * with bidi paragraph properties for RTL languages so Word renders Arabic
 * transcripts correctly.
 */
export async function toDocx(
  title: string,
  segments: TranscriptSegment[],
  language: string | null,
  names: SpeakerNames = {},
): Promise<Buffer> {
  const rtl = ["ar", "fa", "ur", "he"].includes((language ?? "").split("-")[0] ?? "");
  const bidi = rtl ? "<w:bidi/>" : "";

  const paragraphs = segments
    .map((seg) => {
      const speaker = speakerDisplay(seg.speaker, names);
      const runs = [
        speaker
          ? `<w:r><w:rPr><w:b/>${rtl ? "<w:rtl/>" : ""}</w:rPr><w:t xml:space="preserve">${xmlEscape(speaker)}: </w:t></w:r>`
          : "",
        `<w:r>${rtl ? "<w:rPr><w:rtl/></w:rPr>" : ""}<w:t xml:space="preserve">${xmlEscape(seg.text)}</w:t></w:r>`,
      ].join("");
      return `<w:p><w:pPr>${bidi}</w:pPr>${runs}</w:p>`;
    })
    .join("");

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr>${bidi}<w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>${xmlEscape(title)}</w:t></w:r></w:p>
    ${paragraphs}
  </w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.file("word/document.xml", documentXml);
  return zip.generateAsync({ type: "nodebuffer" }) as Promise<Buffer>;
}

// ── PDF (minimal, Latin scripts) ──────────────────────────────────────────────

/** True when the transcript can be represented in the built-in PDF fonts. */
export function pdfCanRender(text: string): boolean {
  // WinAnsi (Latin-1-ish) only — anything beyond needs embedded fonts.
  return /^[\x20-\x7E -ÿ\s]*$/.test(text);
}

export function toPdf(title: string, segments: TranscriptSegment[], names: SpeakerNames = {}): Buffer {
  const lines: string[] = [title, ""];
  let lastSpeaker: string | null = null;
  for (const seg of segments) {
    const speaker = speakerDisplay(seg.speaker, names);
    if (speaker && speaker !== lastSpeaker) {
      lines.push(`${speaker}:`);
      lastSpeaker = speaker;
    }
    // naive wrap at ~90 chars
    for (let t = seg.text; t.length > 0; t = t.slice(90)) lines.push(t.slice(0, 90));
  }

  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const linesPerPage = 48;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) pages.push(lines.slice(i, i + linesPerPage));
  if (pages.length === 0) pages.push([""]);

  const objects: string[] = [];
  const pageIds = pages.map((_, i) => 4 + i * 2);
  objects.push(`1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`);
  objects.push(
    `2 0 obj << /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >> endobj`,
  );
  objects.push(`3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj`);
  pages.forEach((pageLines, i) => {
    const contentLines = pageLines.map((l) => `(${esc(l)}) Tj T*`).join("\n");
    const stream = `BT /F1 11 Tf 14 TL 56 780 Td\n${contentLines}\nET`;
    objects.push(
      `${4 + i * 2} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >> endobj`,
    );
    objects.push(`${5 + i * 2} 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += obj + "\n";
  }
  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}
