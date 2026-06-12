"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";
import StageCopy from "./StageCopy";

const TUBES = [
  { x: 150, fill: 0.72, color: "#FFFFFF" },
  { x: 230, fill: 0.55, color: "#FFF7E8" },
  { x: 310, fill: 0.85, color: "#EEF4FA" },
];

/**
 * Stage 2 — the laboratory. Equipment fades in piece by piece, test
 * tubes fill, analysis bars run, and the batch is stamped PASSED.
 */
export default function StageTesting() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const section = ref.current;
    if (!section || reduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      tl.fromTo(".stage-copy", { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.18, ease: "power2.out" }, 0.02);

      // Lab equipment materialises one piece at a time.
      tl.fromTo(
        ".lab-item",
        { y: 26, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.16, stagger: 0.05, ease: "power2.out" },
        0.05
      );

      // Samples fill the tubes...
      tl.fromTo(
        ".tube-fill",
        { scaleY: 0, transformOrigin: "center bottom" },
        { scaleY: 1, duration: 0.22, stagger: 0.07 },
        0.28
      );

      // ...while the analyser bars chase their readings.
      tl.fromTo(
        ".lab-bar",
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.24, stagger: 0.06 },
        0.42
      );

      // Verdict stamp.
      tl.fromTo(
        ".lab-pass",
        { scale: 2.2, autoAlpha: 0, svgOrigin: "718 178" },
        { scale: 1, autoAlpha: 1, duration: 0.1, ease: "power3.in" },
        0.8
      );
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={ref} className={`relative grain bg-deep-950 ${reduced ? "" : "h-[180vh]"}`}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="container-site grid w-full items-center gap-10 py-20 lg:grid-cols-2 lg:gap-16">
          <div className="relative order-last lg:order-first">
            <svg viewBox="0 0 900 560" className="w-full" role="img" aria-label="Laboratory quality testing of milk samples">
              <defs>
                <pattern id="t2-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                  <path d="M36 0H0V36" fill="none" stroke="#2D659F" strokeWidth="0.5" opacity="0.35" />
                </pattern>
                <linearGradient id="t2-screen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#123A66" />
                  <stop offset="1" stopColor="#071F38" />
                </linearGradient>
              </defs>

              <rect width="900" height="560" rx="24" fill="#071F38" />
              <rect width="900" height="560" rx="24" fill="url(#t2-grid)" />

              {/* lab bench */}
              <rect x="60" y="452" width="780" height="12" rx="6" fill="#2D659F" opacity="0.6" />

              {/* test tubes in a rack */}
              <g className="lab-item">
                <rect x="120" y="430" width="260" height="22" rx="8" fill="#123A66" />
                {TUBES.map((tube, i) => (
                  <g key={i}>
                    {/* liquid (scrub fills) */}
                    <rect
                      className="tube-fill"
                      x={tube.x + 4}
                      y={300 + (1 - tube.fill) * 130}
                      width="32"
                      height={tube.fill * 130}
                      rx="10"
                      fill={tube.color}
                    />
                    {/* glass */}
                    <path
                      d={`M${tube.x} 250 v160 a20 20 0 0 0 40 0 v-160`}
                      fill="none"
                      stroke="#7FA8D3"
                      strokeWidth="3"
                    />
                    <line x1={tube.x - 6} y1="250" x2={tube.x + 46} y2="250" stroke="#7FA8D3" strokeWidth="3" />
                  </g>
                ))}
              </g>

              {/* microscope silhouette */}
              <g className="lab-item" fill="#AFC9E5">
                <rect x="430" y="436" width="150" height="16" rx="8" />
                <path d="M470 436 q-6 -60 36 -88 l14 16 q-34 24 -28 72 Z" />
                <rect x="497" y="318" width="22" height="48" rx="6" transform="rotate(-36 508 342)" />
                <rect x="513" y="276" width="18" height="40" rx="6" transform="rotate(-36 522 296)" />
                <circle cx="500" cy="452" r="6" fill="#071F38" />
              </g>

              {/* digital analyser */}
              <g className="lab-item">
                <rect x="610" y="240" width="216" height="212" rx="14" fill="url(#t2-screen)" stroke="#2D659F" strokeWidth="2" />
                <text x="630" y="276" fontSize="15" letterSpacing="2" fill="#7FA8D3">
                  BATCH ANALYSIS
                </text>
                {[
                  { y: 300, label: "PROTEIN", w: 150 },
                  { y: 344, label: "FAT", w: 96 },
                  { y: 388, label: "MICROBIO", w: 168 },
                ].map((row) => (
                  <g key={row.label}>
                    <text x="630" y={row.y + 6} fontSize="12" fill="#AFC9E5" letterSpacing="1">
                      {row.label}
                    </text>
                    <rect x="630" y={row.y + 14} width="176" height="8" rx="4" fill="#123A66" />
                    <rect className="lab-bar" x="630" y={row.y + 14} width={row.w} height="8" rx="4" fill="#C9A96A" />
                  </g>
                ))}
                <text x="630" y="440" fontSize="12" fill="#7FA8D3" letterSpacing="1">
                  STANDARD: STB / EAC / ISO
                </text>
              </g>

              {/* PASSED stamp */}
              <g className="lab-pass">
                <circle cx="718" cy="178" r="44" fill="none" stroke="#C9A96A" strokeWidth="3" />
                <circle cx="718" cy="178" r="36" fill="none" stroke="#C9A96A" strokeWidth="1" opacity="0.6" />
                <path d="M700 178 l12 12 24 -26" fill="none" stroke="#C9A96A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>

          <StageCopy
            index={2}
            kicker="Quality Testing"
            title="Nothing enters production unproven."
            text="Every batch undergoes strict quality testing before entering production."
            tone="dark"
          />
        </div>
      </div>
    </section>
  );
}
