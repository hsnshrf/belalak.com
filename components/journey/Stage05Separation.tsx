"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";
import {
  FALLBACK_FAT,
  useJourneyState,
  type FatChoice,
} from "@/lib/journeyState";
import { drawTween, useStagePin } from "@/lib/stageAnimation";
import ChoiceCards from "./ChoiceCards";
import StageCopy from "./StageCopy";

/**
 * STAGE 05 — DECISION POINT #1: skim or whole?
 *
 * The scrub timeline brings the centrifugal separator in and then rests
 * (dwell) while the visitor chooses. The choice plays a NON-scrubbed
 * branch animation and writes the Zustand store, which every downstream
 * stage reads. Scrolling past without choosing applies the whole-milk
 * default (announced, changeable via the floating chip).
 */
export default function Stage05Separation() {
  const fat = useJourneyState((s) => s.fat);
  const setFat = useJourneyState((s) => s.setFat);
  const reduced = usePrefersReducedMotion();
  const branchTl = useRef<gsap.core.Timeline | null>(null);

  const ref = useStagePin({
    id: "stage-separation",
    length: 2400,
    onLeave: () => {
      if (!useJourneyState.getState().fat) setFat(FALLBACK_FAT, true);
    },
    build: ({ tl, q }) => {
      tl.fromTo(q(".stage-copy"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, 0)
        .fromTo(q(".sep-machine"), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1);
      const inlet = q(".sep-inlet")[0];
      if (inlet) tl.add(drawTween(inlet, { duration: 0.4 }));
      tl.fromTo(q(".sep-cards"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4 }, "-=0.1");
      // Dwell: hold the pin so there's time to decide before scrolling on.
      tl.to({}, { duration: 1.6 });
    },
  });

  // Branch visuals react to the store (also covers the applied default and
  // "change my choice" jumps back from later in the page).
  useEffect(() => {
    if (!fat) return;
    const root = ref.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    branchTl.current?.kill();
    const d = reduced ? 0 : 1; // duration multiplier — instant under reduced motion
    const tl = gsap.timeline();
    branchTl.current = tl;

    const spin = root.querySelector(".sep-spin-lines");
    if (fat === "skim") {
      spin?.classList.add("spinning");
      tl.to(q(".sep-vis-whole"), { opacity: 0, duration: 0.2 * d }, 0)
        .to(q(".sep-vis-skim"), { opacity: 1, duration: 0.2 * d }, 0)
        .fromTo(q(".sep-rpm"), { opacity: 0 }, { opacity: 1, duration: 0.3 * d }, 0.1 * d);
      const cream = q(".sep-cream-line")[0];
      if (cream) tl.add(drawTween(cream, { duration: 0.7 * d, ease: "power1.inOut" }), 0.15 * d);
      tl.fromTo(
        q(".sep-tank-cream"),
        { attr: { height: 0, y: 352 } },
        { attr: { height: 64, y: 288 }, duration: 0.8 * d },
        "<0.25"
      );
      const skimLine = q(".sep-skim-line")[0];
      if (skimLine) tl.add(drawTween(skimLine, { duration: 0.8 * d, ease: "power1.inOut" }), "<");
    } else {
      spin?.classList.remove("spinning");
      tl.to(q(".sep-vis-skim"), { opacity: 0, duration: 0.2 * d }, 0)
        .to(q(".sep-vis-whole"), { opacity: 1, duration: 0.2 * d }, 0);
      const bypass = q(".sep-bypass-line")[0];
      if (bypass) tl.add(drawTween(bypass, { duration: 0.9 * d, ease: "power1.inOut" }), 0.1 * d);
      tl.fromTo(q(".sep-globules"), { opacity: 0 }, { opacity: 1, duration: 0.4 * d }, "<0.4");
      const wholeLine = q(".sep-whole-line")[0];
      if (wholeLine) tl.add(drawTween(wholeLine, { duration: 0.6 * d, ease: "power1.inOut" }), "<0.2");
    }
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fat, reduced]);

  return (
    <section
      id="stage-separation"
      ref={ref as React.RefObject<HTMLElement>}
      aria-labelledby="stage-separation-title"
      className="relative overflow-hidden bg-ivory"
    >
      <div className="container-site flex min-h-svh flex-col gap-4 pb-6 pt-[calc(var(--nav-height)+1.25rem)] md:grid md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-4">
          <StageCopy
            id="stage-separation"
            num="05"
            kicker="DECISION № 1 · SEPARATION"
            title="Skim it — or keep it whole?"
          >
            <p>
              The centrifugal separator spins pasteurized milk at thousands
              of g. Lighter cream migrates inward and exits its own outlet;
              lean skim milk continues down the line. Or the separator is
              bypassed and the milk is only standardized, keeping its fat.
            </p>
            <p className="readout !text-cream">
              YOUR CHOICE SETS THE LINE — IT CHANGES EVERY STAGE DOWNSTREAM.
            </p>
          </StageCopy>
        </div>

        <div className="min-h-0 flex-1 md:col-span-8">
          <svg
            viewBox="0 0 900 560"
            role="img"
            aria-label="A centrifugal cream separator with two outlets: golden cream diverted to a cream tank, white skim milk continuing down — or a bypass line keeping the milk whole with fat globules suspended"
            className="mx-auto h-full max-h-[46vh] w-full md:max-h-[54vh]"
          >
            <defs>
              <linearGradient id="sep-steel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="stop-steel-hi" />
                <stop offset="50%" className="stop-steel-mid" />
                <stop offset="100%" className="stop-steel-lo" />
              </linearGradient>
            </defs>

            <g className="sep-machine">
              {/* inlet from pasteurization */}
              <path d="M450,0 L450,140" fill="none" stroke="var(--m-glass)" strokeWidth="10" opacity="0.55" />
              <path className="sep-inlet" d="M450,0 L450,140" fill="none" stroke="var(--m-milk-raw)" strokeWidth="6" />

              {/* pedestal + motor */}
              <path d="M385,470 L515,470 L540,530 L360,530 Z" fill="var(--m-steel-lo)" stroke="var(--m-steel-edge)" strokeWidth="1.2" />
              <rect x="398" y="418" width="104" height="52" rx="8" fill="url(#sep-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.2" />

              {/* bowl housing with cutaway */}
              <path
                d="M372,300 L372,240 C372,190 405,158 450,155 C495,158 528,190 528,240 L528,300 C528,364 502,412 450,416 C398,412 372,364 372,300 Z"
                fill="url(#sep-steel)"
                stroke="var(--m-steel-edge)"
                strokeWidth="1.5"
              />
              <rect x="398" y="196" width="104" height="192" rx="10" fill="rgb(var(--c-steel-deep))" opacity="0.92" />
              {/* disc stack (nested cones, seen in section) */}
              <g stroke="var(--m-steel-hi)" strokeWidth="2.6" fill="none" opacity="0.85">
                {[236, 254, 272, 290, 308, 326, 344, 362].map((y) => (
                  <path key={y} d={`M408,${y} L450,${y - 15} L492,${y}`} />
                ))}
              </g>
              {/* spindle */}
              <line x1="450" y1="200" x2="450" y2="386" stroke="var(--m-steel-mid)" strokeWidth="4" />

              {/* outlet stubs */}
              <rect x="524" y="222" width="26" height="10" rx="3" fill="var(--m-steel-mid)" />
              <rect x="440" y="412" width="20" height="16" rx="3" fill="var(--m-steel-mid)" />

              {/* labels */}
              <text x="450" y="452" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-milk))">
                SEPARATOR
              </text>
            </g>

            {/* ---- SKIM branch visuals ---- */}
            <g className="sep-vis-skim" opacity="0">
              {/* spin indicator — .spinning (CSS rotation) is toggled when separating */}
              <g className="sep-spin-lines">
                <circle cx="450" cy="292" r="58" fill="none" stroke="rgb(var(--c-cream))" strokeWidth="2" strokeDasharray="10 46" strokeLinecap="round" opacity="0.85" />
              </g>
              <text className="sep-rpm" x="560" y="180" fontFamily="var(--font-mono)" fontSize="11" fill="rgb(var(--c-cream))">
                bowl · 6 500 rpm
              </text>
              {/* cream stream to the cream tank */}
              <path d="M540,227 C610,227 650,240 700,258" fill="none" stroke="var(--m-glass)" strokeWidth="8" opacity="0.5" />
              <path className="sep-cream-line" d="M540,227 C610,227 650,240 700,258" fill="none" stroke="var(--m-cream-deep)" strokeWidth="5" strokeLinecap="round" />
              {/* cream tank */}
              <rect x="700" y="240" width="110" height="120" rx="12" fill="url(#sep-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.4" />
              <clipPath id="sep-tank-clip">
                <rect x="705" y="245" width="100" height="110" rx="9" />
              </clipPath>
              <g clipPath="url(#sep-tank-clip)">
                <rect className="sep-tank-cream" x="705" y="288" width="100" height="64" fill="rgb(var(--c-cream))" opacity="0.9" />
              </g>
              <text x="755" y="382" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="rgb(var(--c-steel))">
                CREAM
              </text>
              <text x="755" y="397" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="rgb(var(--c-steel))" opacity="0.8">
                → butter &amp; cream products
              </text>
              {/* skim milk continues down */}
              <path d="M450,428 L450,560" fill="none" stroke="var(--m-glass)" strokeWidth="10" opacity="0.55" />
              <path className="sep-skim-line" d="M450,428 L450,560" fill="none" stroke="var(--m-milk-cool)" strokeWidth="6" />
              <text x="466" y="520" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-steel))">
                skim · fat ≤ 0.1 %
              </text>
            </g>

            {/* ---- WHOLE branch visuals ---- */}
            <g className="sep-vis-whole" opacity="0">
              {/* bypass around the separator */}
              <path d="M450,110 C600,120 640,210 640,330 C640,452 520,470 452,505" fill="none" stroke="var(--m-glass)" strokeWidth="9" opacity="0.5" />
              <path className="sep-bypass-line" d="M450,110 C600,120 640,210 640,330 C640,452 520,470 452,505" fill="none" stroke="var(--m-milk-raw)" strokeWidth="5.5" strokeLinecap="round" />
              {/* fat globules riding the stream */}
              <g className="sep-globules">
                <path className="flow-dash-slow" d="M450,110 C600,120 640,210 640,330 C640,452 520,470 452,505" fill="none" stroke="rgb(var(--c-cream))" strokeWidth="4" style={{ strokeDasharray: "3 26" }} strokeLinecap="round" opacity="0.9" />
              </g>
              <path className="sep-whole-line" d="M450,505 L450,560" fill="none" stroke="var(--m-milk-raw)" strokeWidth="6" />
              <text x="656" y="330" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-steel))">
                bypass · fat ~3.5 %
              </text>
            </g>
          </svg>

          <div className="sep-cards mt-4">
            <ChoiceCards<FatChoice>
              label="Decision one: choose skim or whole milk"
              value={fat}
              onChoose={(v) => setFat(v)}
              choices={[
                {
                  value: "skim",
                  title: "Make skim milk powder",
                  body: "Spin out the cream. It leaves for butter & cream production; lean milk continues down the line.",
                  tag: "→ SMP · SKIM MILK POWDER",
                },
                {
                  value: "whole",
                  title: "Keep it whole",
                  body: "Bypass the separator — only standardized. Fat globules stay suspended in the stream.",
                  tag: "→ WMP · WHOLE MILK POWDER",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
