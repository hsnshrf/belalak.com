"use client";

import { useJourneyState } from "@/lib/journeyState";
import { counterTween, drawTween, useStagePin } from "@/lib/stageAnimation";
import StageCopy from "./StageCopy";

/**
 * STAGE 06 — Multi-effect falling-film evaporation.
 *
 * Choreography: the two-effect evaporator rises in; milk draws into
 * effect 1 and thin films run down the tubes; vapor rises off the
 * separator and is reused to heat effect 2 (that's the "multi-effect");
 * the stream re-draws into effect 2, the total-solids counter climbs
 * 12.5 → 48 % and the outgoing concentrate line is denser and darker.
 * If the visitor chose WHOLE at stage 05, gold fat globules ride the
 * concentrate line (live store read).
 */
export default function Stage06Evaporation() {
  const fat = useJourneyState((s) => s.fat);

  const ref = useStagePin({
    id: "stage-evaporation",
    length: 2600,
    build: ({ tl, q }) => {
      tl.fromTo(q(".stage-copy"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, 0)
        .fromTo(q(".evap-machine"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1)
        .fromTo(q(".evap-readout"), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, 0.3);

      const [milkIn, milkMid, milkOut] = q(".evap-milk");
      const ts = q(".evap-ts")[0];

      if (milkIn) tl.add(drawTween(milkIn, { duration: 0.5 }), "+=0.05");
      tl.fromTo(q(".evap-films-1"), { opacity: 0 }, { opacity: 1, duration: 0.35 }, "-=0.15");
      tl.fromTo(q(".evap-vapor-1"), { opacity: 0 }, { opacity: 1, duration: 0.35 });

      if (ts) {
        tl.add(
          counterTween(ts, { from: 12.5, to: 48, decimals: 1, suffix: " %", duration: 1.9 }),
          "<"
        );
      }

      if (milkMid) tl.add(drawTween(milkMid, { duration: 0.5 }), "<0.2");
      tl.fromTo(q(".evap-films-2"), { opacity: 0 }, { opacity: 1, duration: 0.35 }, "-=0.15");
      tl.fromTo(q(".evap-vapor-2"), { opacity: 0 }, { opacity: 1, duration: 0.35 });

      if (milkOut) tl.add(drawTween(milkOut, { duration: 0.6 }), "-=0.1");
      tl.fromTo(q(".evap-out-note"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, "-=0.2");
    },
  });

  return (
    <section
      id="stage-evaporation"
      ref={ref as React.RefObject<HTMLElement>}
      aria-labelledby="stage-evaporation-title"
      className="relative overflow-hidden bg-milk"
    >
      <div className="container-site flex min-h-svh flex-col gap-4 pb-6 pt-[calc(var(--nav-height)+1.25rem)] md:grid md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-4">
          <StageCopy
            id="stage-evaporation"
            num="06"
            kicker="CONCENTRATION"
            title="Four litres become one"
          >
            <p>
              Falling-film evaporators remove most of the water before
              drying. Under vacuum, milk boils at just 68 °C — thin films
              run down heated tubes, water flashes off as vapor, and the
              vapor itself is reused to heat the next effect.
            </p>
            <p className="hidden sm:block">
              Total solids climb from 12.5 % to roughly 48 % while
              heat-sensitive proteins stay protected.
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {["vacuum · 68 °C", "multi-effect economy", "TS 12.5 → 48 %"].map((t) => (
                <li key={t} className="readout rounded border border-steel/25 px-2 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </StageCopy>
        </div>

        <div className="relative min-h-0 flex-1 md:col-span-8">
          <div className="evap-readout absolute right-2 top-2 z-10 rounded-lg border border-steel/20 bg-milk/90 px-3 py-2 font-mono text-xs shadow-sm">
            <p className="text-steel">
              TOTAL SOLIDS <span className="evap-ts font-medium text-ink">48.0 %</span>
            </p>
            <p className="mt-1 text-steel">
              VACUUM <span className="font-medium text-ink">−0.8 bar</span>
            </p>
            <p className="mt-1 text-steel">
              BOILING <span className="font-medium text-ink">68 °C</span>
            </p>
          </div>

          <svg
            viewBox="0 0 960 620"
            role="img"
            aria-label="Two-effect falling-film evaporator: milk films run down heated tubes, water vapor rises and is drawn off, and the milk leaves as a dense concentrate at 48 percent total solids"
            className="evap-machine mx-auto h-full max-h-[62vh] w-full md:max-h-[78vh]"
          >
            <defs>
              <linearGradient id="evap-steel" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" className="stop-steel-hi" />
                <stop offset="50%" className="stop-steel-mid" />
                <stop offset="100%" className="stop-steel-lo" />
              </linearGradient>
            </defs>

            {/* ---------- EFFECT 1 ---------- */}
            <g>
              <ellipse cx="300" cy="104" rx="52" ry="16" fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="1.2" />
              <rect x="248" y="104" width="104" height="330" rx="14" fill="url(#evap-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.4" />
              {/* cutaway tube bundle */}
              <rect x="262" y="130" width="76" height="270" rx="8" fill="rgb(var(--c-steel-deep))" opacity="0.9" />
              {[276, 292, 308, 324].map((x) => (
                <line key={x} x1={x} y1="140" x2={x} y2="392" stroke="var(--m-steel-lo)" strokeWidth="5" opacity="0.7" />
              ))}
              {/* falling milk films */}
              <g className="evap-films-1">
                {[276, 292, 308, 324].map((x) => (
                  <line key={x} className="flow-dash" x1={x} y1="140" x2={x} y2="392" stroke="var(--m-milk-raw)" strokeWidth="2.4" style={{ strokeDasharray: "7 9" }} />
                ))}
              </g>
              <text x="300" y="460" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-steel))">
                EFFECT 1
              </text>
              {/* steam in */}
              <path className="flow-dash-slow" d="M180,250 L246,250" fill="none" stroke="rgb(var(--c-cream))" strokeWidth="4" opacity="0.6" />
              <text x="150" y="240" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-cream))">steam</text>
            </g>

            {/* vapor separator 1 */}
            <g>
              <rect x="392" y="210" width="60" height="150" rx="16" fill="url(#evap-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.2" />
              <g className="evap-vapor-1">
                {[0, 1, 2].map((i) => (
                  <circle key={i} className="vapor" style={{ animationDelay: `${-i * 1.4}s` }} cx={412 + i * 10} cy="205" r={4 - i * 0.6} fill="var(--m-glass)" opacity="0" />
                ))}
                {/* vapor duct reused to heat effect 2 */}
                <path className="flow-dash-slow" d="M422,210 L422,170 L528,170 L528,208" fill="none" stroke="var(--m-glass)" strokeWidth="5" opacity="0.9" />
                <text x="430" y="160" fontFamily="var(--font-mono)" fontSize="9" fill="rgb(var(--c-steel))">
                  vapor reused →
                </text>
              </g>
            </g>

            {/* ---------- EFFECT 2 ---------- */}
            <g>
              <ellipse cx="580" cy="124" rx="52" ry="16" fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="1.2" />
              <rect x="528" y="124" width="104" height="310" rx="14" fill="url(#evap-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.4" />
              <rect x="542" y="150" width="76" height="250" rx="8" fill="rgb(var(--c-steel-deep))" opacity="0.9" />
              {[556, 572, 588, 604].map((x) => (
                <line key={x} x1={x} y1="160" x2={x} y2="392" stroke="var(--m-steel-lo)" strokeWidth="5" opacity="0.7" />
              ))}
              <g className="evap-films-2">
                {[556, 572, 588, 604].map((x) => (
                  <line key={x} className="flow-dash" x1={x} y1="160" x2={x} y2="392" stroke="var(--m-concentrate)" strokeWidth="2.6" style={{ strokeDasharray: "6 8" }} />
                ))}
              </g>
              <text x="580" y="460" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-steel))">
                EFFECT 2
              </text>
            </g>

            {/* vapor separator 2 + condenser duct */}
            <g>
              <rect x="672" y="230" width="60" height="150" rx="16" fill="url(#evap-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.2" />
              <g className="evap-vapor-2">
                {[0, 1, 2].map((i) => (
                  <circle key={i} className="vapor" style={{ animationDelay: `${-i * 1.1}s` }} cx={692 + i * 10} cy="225" r={4 - i * 0.6} fill="var(--m-glass)" opacity="0" />
                ))}
                <path className="flow-dash-slow" d="M702,230 L702,150 L840,150" fill="none" stroke="var(--m-glass)" strokeWidth="5" opacity="0.9" />
                <text x="770" y="140" fontFamily="var(--font-mono)" fontSize="9" fill="rgb(var(--c-steel))">
                  → condenser
                </text>
              </g>
            </g>

            {/* ---------- milk path (three legs, drawn on scroll) ---------- */}
            <g fill="none" strokeLinecap="round">
              {/* glass backing */}
              <g stroke="var(--m-glass)" strokeWidth="9" opacity="0.5">
                <path d="M60,40 L300,40 L300,100" />
                <path d="M300,434 L300,470 L422,470 L422,360 M422,240 L422,80 L580,80 L580,120" />
                <path d="M580,434 L580,480 L702,480 L702,380 M702,260 L702,240 M702,480 L800,480 L800,620" />
              </g>
              {/* leg 1: feed into effect 1 */}
              <path className="evap-milk" d="M60,40 L300,40 L300,100" stroke="var(--m-milk-raw)" strokeWidth="6" />
              {/* leg 2: effect 1 → separator 1 → effect 2 */}
              <path className="evap-milk" d="M300,434 L300,470 L422,470 L422,80 L580,80 L580,120" stroke="var(--m-milk-raw)" strokeWidth="5.5" />
              {/* leg 3: effect 2 → separator 2 → concentrate out (denser) */}
              <path className="evap-milk" d="M580,434 L580,480 L702,480 L800,480 L800,620" stroke="var(--m-concentrate)" strokeWidth="5" />
              {/* fat globules ride along if the WHOLE branch was chosen */}
              {fat === "whole" && (
                <path className="flow-dash-slow" d="M580,434 L580,480 L702,480 L800,480 L800,620" stroke="rgb(var(--c-cream))" strokeWidth="3.5" style={{ strokeDasharray: "2.5 22" }} strokeLinecap="round" opacity="0.85" />
              )}
            </g>
            <text className="evap-out-note" x="816" y="560" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-steel))">
              concentrate · 48 % TS
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
