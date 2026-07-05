import type { SearchMatch, TranscriptSegment } from "@voicevault/shared";

/**
 * Maps keyword matches inside a transcript to exact audio timestamps using the
 * word-level offsets stored with each segment. Pure logic — Postgres finds
 * WHICH transcripts match; this finds WHERE in the audio each hit lives.
 *
 * Normalization is deliberately script-neutral so it works for Latin, Arabic,
 * Farsi, Urdu, Cyrillic, CJK…: Unicode NFKC, lower-case, combining marks
 * (Arabic harakat, Hebrew niqqud) stripped, tatweel removed, punctuation
 * trimmed from token edges.
 */

export function normalizeToken(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ـ/g, "") // Arabic tatweel
    .replace(/\p{M}/gu, "") // combining marks / diacritics
    .replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, ""); // edge punctuation
}

export interface LocatedMatch extends SearchMatch {
  timeSeconds: number | null;
}

/**
 * Find every occurrence of `query` (single word or an exact multi-word phrase)
 * across segments. Each hit yields the start time of its first word and a
 * snippet with `<mark>` around the matched words, plus `contextWords` words of
 * context either side.
 */
export function locateMatches(
  segments: TranscriptSegment[],
  query: string,
  opts: { contextWords?: number; maxMatches?: number } = {},
): LocatedMatch[] {
  const contextWords = opts.contextWords ?? 6;
  const maxMatches = opts.maxMatches ?? 10;
  const terms = query.split(/\s+/).map(normalizeToken).filter(Boolean);
  if (terms.length === 0) return [];

  const matches: LocatedMatch[] = [];
  for (const segment of segments) {
    const norm = segment.words.map((w) => normalizeToken(w.w));
    for (let i = 0; i + terms.length <= norm.length; i++) {
      let hit = true;
      for (let j = 0; j < terms.length; j++) {
        if (norm[i + j] !== terms[j]) {
          hit = false;
          break;
        }
      }
      if (!hit) continue;

      const from = Math.max(0, i - contextWords);
      const to = Math.min(segment.words.length, i + terms.length + contextWords);
      const parts: string[] = [];
      if (from > 0) parts.push("…");
      for (let k = from; k < to; k++) {
        const token = escapeHtml(segment.words[k]!.w);
        parts.push(k >= i && k < i + terms.length ? `<mark>${token}</mark>` : token);
      }
      if (to < segment.words.length) parts.push("…");

      matches.push({
        timeSeconds: segment.words[i]!.s,
        segmentId: segment.id,
        snippetHtml: parts.join(" "),
      });
      if (matches.length >= maxMatches) return matches;
      i += terms.length - 1; // don't re-match inside this phrase
    }
  }

  // Segments without word timing (e.g. hand-edited text): fall back to a
  // text-level match so the hit is still shown, just without a seek position.
  if (matches.length === 0) {
    const needle = terms.join(" ");
    for (const segment of segments) {
      const normText = segment.text
        .split(/\s+/)
        .map(normalizeToken)
        .filter(Boolean)
        .join(" ");
      if (normText.includes(needle)) {
        matches.push({
          timeSeconds: segment.words[0]?.s ?? segment.start ?? null,
          segmentId: segment.id,
          snippetHtml: escapeHtml(truncate(segment.text, 160)),
        });
        if (matches.length >= maxMatches) break;
      }
    }
  }
  return matches;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
