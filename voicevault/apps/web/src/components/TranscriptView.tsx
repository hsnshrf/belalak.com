"use client";

import { RTL_LOCALES, type Speaker, type TranscriptSegment } from "@voicevault/shared";
import { Fragment, useEffect, useMemo, useRef } from "react";

/**
 * Karaoke-style transcript: the word under the playhead is highlighted and
 * kept in view; clicking any word seeks the audio to that word's start time.
 * Direction follows the transcript language (RTL for Arabic/Farsi/Urdu).
 */
export function TranscriptView(props: {
  segments: TranscriptSegment[];
  language: string | null;
  speakers: Pick<Speaker, "label" | "displayName">[];
  currentTime: number;
  onSeek(seconds: number): void;
}) {
  const { segments, language, speakers, currentTime, onSeek } = props;
  const activeRef = useRef<HTMLSpanElement>(null);
  const dir = language && RTL_LOCALES.has(language.split("-")[0]!) ? "rtl" : "ltr";

  const speakerName = useMemo(() => {
    const map = new Map(speakers.map((s) => [s.label, s.displayName]));
    return (label: string | null) => {
      if (!label) return null;
      const custom = map.get(label);
      if (custom) return custom;
      const n = label.replace(/\D/g, "");
      return n ? `Speaker ${n}` : label;
    };
  }, [speakers]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentTime]);

  let lastSpeaker: string | null | undefined;

  return (
    <div className="transcript" dir={dir}>
      {segments.map((seg) => {
        // Segments may carry their own language (code-switching): flip
        // direction per segment when it disagrees with the document.
        const segDir = seg.language && RTL_LOCALES.has(seg.language.split("-")[0]!) ? "rtl" : dir;
        const showSpeaker = seg.speaker !== lastSpeaker && seg.speaker !== null;
        lastSpeaker = seg.speaker;
        return (
          <p key={seg.id} dir={segDir}>
            {showSpeaker && <span className="speaker">{speakerName(seg.speaker)}</span>}
            {seg.words.length > 0
              ? seg.words.map((w, i) => {
                  const active = currentTime >= w.s && currentTime < w.e;
                  return (
                    <Fragment key={`${seg.id}-${i}`}>
                      <span
                        ref={active ? activeRef : undefined}
                        className={active ? "word active" : "word"}
                        onClick={() => onSeek(w.s)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && onSeek(w.s)}
                      >
                        {w.w}
                      </span>{" "}
                    </Fragment>
                  );
                })
              : // Edited segments may lack word timings — still seekable by segment.
                (
                  <span className="word" onClick={() => onSeek(seg.start)} role="button" tabIndex={0}>
                    {seg.text}
                  </span>
                )}
          </p>
        );
      })}
    </div>
  );
}
