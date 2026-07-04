"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks";
import { useJourneyState } from "@/lib/journeyState";

/**
 * The signature element: the continuous milk stream connecting every stage.
 * Each connector is a short section with a vertical pipe; a scrubbed tween
 * wipes the milk column downward as the visitor scrolls through, and the
 * stream visibly CHANGES STATE along the page:
 *
 *   chilled → arrival → accepted → pasteurized → skim|whole →
 *   concentrate → to-dryer (± lecithin) → powder
 *
 * Post-decision variants read the Zustand store live, so the branch choices
 * are reflected in the stream itself.
 */
export type StreamVariant =
  | "chilled"
  | "arrival"
  | "accepted"
  | "pasteurized"
  | "fat"
  | "concentrate"
  | "toDryer"
  | "powder";

const STATIC_LABELS: Record<Exclude<StreamVariant, "fat" | "toDryer">, string> =
  {
    chilled: "RAW MILK · CHILLED 4 °C",
    arrival: "ARRIVAL · RECEPTION BAY",
    accepted: "ACCEPTED · TO PROCESS",
    pasteurized: "PASTEURIZED · 72.5 °C / 15 s",
    concentrate: "CONCENTRATE · ~48 % TS",
    powder: "POWDER · MOISTURE ≤ 4 %",
  };

export default function StreamConnector({
  variant,
}: {
  variant: StreamVariant;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fat = useJourneyState((s) => s.fat);
  const texture = useJourneyState((s) => s.texture);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    // Motion users: the milk column wipes downward with scroll. Reduced
    // motion: the column is authored full-height and simply stays there.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const col = root.querySelector(".stream-col");
      if (!col) return;
      gsap.fromTo(
        col,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top 80%",
            end: "bottom 45%",
            scrub: 0.5,
          },
        }
      );
      gsap.fromTo(
        root.querySelector(".stream-label"),
        { opacity: 0, x: -6 },
        {
          opacity: 1,
          x: 0,
          scrollTrigger: {
            trigger: root,
            start: "top 65%",
            end: "top 35%",
            scrub: true,
          },
        }
      );
    });
    return () => mm.revert();
  }, []);

  // Resolve state-dependent appearance.
  const awaiting =
    (variant === "fat" && fat === null) ||
    (variant === "toDryer" && texture === null);

  let color = "var(--m-milk-cool)";
  let label = "";
  let showGlobules = false;
  let wide = false;
  const powder = variant === "powder";

  switch (variant) {
    case "chilled":
    case "arrival":
    case "accepted":
      color = "var(--m-milk-cool)";
      label = STATIC_LABELS[variant];
      break;
    case "pasteurized":
      color = "var(--m-milk-raw)";
      label = STATIC_LABELS.pasteurized;
      break;
    case "fat":
      if (fat === "skim") {
        color = "var(--m-milk-cool)";
        label = "SKIM MILK · FAT ≤ 0.1 %";
      } else {
        color = "var(--m-milk-raw)";
        label = fat === "whole" ? "WHOLE MILK · FAT ~3.5 %" : "AWAITING SELECTION";
        showGlobules = fat === "whole";
      }
      break;
    case "concentrate":
      color = "var(--m-concentrate)";
      label = STATIC_LABELS.concentrate;
      showGlobules = fat === "whole";
      wide = true;
      break;
    case "toDryer":
      color = "var(--m-concentrate)";
      label =
        texture === null
          ? "AWAITING SELECTION"
          : texture === "instant"
            ? "CONCENTRATE + LECITHIN"
            : "CONCENTRATE · NOTHING ADDED";
      showGlobules = fat === "whole";
      wide = true;
      break;
    case "powder":
      label = STATIC_LABELS.powder;
      break;
  }

  return (
    <div
      ref={rootRef}
      className="relative flex h-[38vh] justify-center bg-milk sm:h-[46vh]"
    >
      <div className="relative h-full w-[76px]">
        {/* pipe flanges */}
        <span aria-hidden className="absolute -top-1 left-1/2 h-2 w-14 -translate-x-1/2 rounded-sm bg-[var(--m-steel-mid)]" />
        <span aria-hidden className="absolute -bottom-1 left-1/2 h-2 w-14 -translate-x-1/2 rounded-sm bg-[var(--m-steel-mid)]" />
        {/* pipe walls */}
        <span aria-hidden className="absolute inset-y-0 left-[14px] w-[3px] bg-gradient-to-b from-[var(--m-steel-mid)] via-[var(--m-steel-lo)] to-[var(--m-steel-mid)]" />
        <span aria-hidden className="absolute inset-y-0 right-[14px] w-[3px] bg-gradient-to-b from-[var(--m-steel-mid)] via-[var(--m-steel-lo)] to-[var(--m-steel-mid)]" />

        {/* milk column (authored full — scrub wipes it in) */}
        {!powder && (
          <span
            aria-hidden
            className={`stream-col absolute inset-y-0 origin-top ${
              wide ? "left-[19px] right-[19px]" : "left-[23px] right-[23px]"
            } ${awaiting ? "border border-dashed border-steel/40 bg-transparent" : ""}`}
            style={awaiting ? undefined : { backgroundColor: color }}
          />
        )}

        {/* flow dashes / powder fall / fat globules */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          width="76"
          preserveAspectRatio="none"
        >
          {powder ? (
            <>
              <line x1="30" y1="0" x2="30" y2="100%" className="flow-dash" stroke="var(--m-powder)" strokeWidth="3" style={{ strokeDasharray: "3 14" }} strokeLinecap="round" />
              <line x1="38" y1="0" x2="38" y2="100%" className="flow-dash-slow" stroke="var(--m-powder)" strokeWidth="3" style={{ strokeDasharray: "2 11" }} strokeLinecap="round" />
              <line x1="46" y1="0" x2="46" y2="100%" className="flow-dash" stroke="var(--m-powder)" strokeWidth="3" style={{ strokeDasharray: "3 17" }} strokeLinecap="round" />
            </>
          ) : (
            !awaiting && (
              <line x1="38" y1="0" x2="38" y2="100%" className="flow-dash" stroke="rgb(var(--c-milk))" strokeWidth="4" opacity="0.7" />
            )
          )}
          {showGlobules && (
            <line x1="32" y1="0" x2="32" y2="100%" className="flow-dash-slow" stroke="rgb(var(--c-cream))" strokeWidth="4" style={{ strokeDasharray: "3 24" }} strokeLinecap="round" opacity="0.85" />
          )}
        </svg>

        {/* state label */}
        <p className="stream-label readout absolute left-[84px] top-[42%] w-max max-w-[38vw] whitespace-pre-line">
          {label}
        </p>
      </div>
    </div>
  );
}
