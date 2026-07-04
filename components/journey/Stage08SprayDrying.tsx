"use client";

import { useEffect, useRef } from "react";
import { useJourneyState } from "@/lib/journeyState";
import { counterTween, drawTween, useStagePin } from "@/lib/stageAnimation";
import { cssVar, SprayEngine } from "@/lib/sprayEngine";
import StageCopy from "./StageCopy";

/**
 * STAGE 08 — Spray drying. The signature moment of the site.
 *
 * SVG renders the tower cutaway, air heater, cyclone and fluid bed;
 * a Canvas 2D particle system (lib/sprayEngine.ts) lives inside the
 * tower: concentrate is atomized at the top, droplets dry mid-fall into
 * powder and a heap grows at the cone. The scrub timeline drives scene
 * reveal + readouts and feeds its progress to the engine; the rAF loop
 * only runs while the stage is on screen. Reduced motion gets a single
 * static frame (arrested spray + full heap).
 *
 * Canvas geometry is normalized against the SVG viewBox (900×720) and the
 * canvas overlays the SVG exactly (same aspect-ratio box), so the two
 * stay aligned at every size.
 */

// Tower interior in viewBox coordinates (must match the SVG below).
const GEO = {
  centerX: 400 / 900,
  nozzleY: 118 / 720,
  chamberHalfWidth: 152 / 900,
  coneTopY: 400 / 720,
  coneBottomY: 542 / 720,
  outletHalfWidth: 18 / 900,
};

export default function Stage08SprayDrying() {
  const texture = useJourneyState((s) => s.texture);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SprayEngine | null>(null);
  // Pin-active state, mirrored so the engine can catch up if it's created
  // after the trigger already toggled (e.g. deep-linking into the stage).
  const pinActiveRef = useRef(false);

  const ref = useStagePin({
    id: "stage-spray-drying",
    length: 3400,
    scrub: 0.5,
    // Run the simulation only while the stage is pinned. This must come
    // from the pin trigger itself — a separate ScrollTrigger on a pinned
    // element ignores the pin spacer and toggles off mid-pin.
    onToggle: (active) => {
      pinActiveRef.current = active;
      if (active) engineRef.current?.start();
      else engineRef.current?.stop();
    },
    build: ({ tl, q }) => {
      tl.fromTo(q(".stage-copy"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, 0)
        .fromTo(q(".spray-scene"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1)
        .fromTo(q(".spray-readout"), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, 0.35);

      // Air heater comes up, hot-air gradient breathes in.
      tl.fromTo(q(".spray-heat-el"), { opacity: 0.25 }, { opacity: 1, duration: 0.4 }, 0.3)
        .fromTo(q(".spray-hot-air"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, "<0.2");

      // Concentrate feed reaches the atomizer.
      const feed = q(".spray-feed")[0];
      if (feed) tl.add(drawTween(feed, { duration: 0.4 }), "<");

      // Moisture falls across most of the drying run.
      const moisture = q(".spray-moisture")[0];
      if (moisture) {
        tl.add(
          counterTween(moisture, { from: 45, to: 3.5, decimals: 1, suffix: " %", duration: 2.2 }),
          "+=0.1"
        );
      }
      // Cyclone + fines return activate mid-run.
      tl.fromTo(q(".spray-cyclone-flow"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, "<0.5");

      // Discharge: powder crosses the fluid bed and exits down the line.
      const discharge = q(".spray-discharge")[0];
      if (discharge) tl.add(drawTween(discharge, { duration: 0.6 }), "-=0.6");
      tl.fromTo(q(".spray-out-label"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, "-=0.2");

      // Feed engine progress from the scrub position.
      tl.eventCallback("onUpdate", () => {
        engineRef.current?.setProgress(tl.progress());
      });
    },
  });

  // Canvas engine lifecycle — separate from the scrub timeline.
  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    const root = ref.current;
    if (!canvas || !frame || !root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const engine = new SprayEngine(canvas, {
      geometry: GEO,
      colors: {
        droplet: cssVar("--m-milk-warm", "#fff3da"),
        powder: cssVar("--m-powder", "#f7f1e2"),
      },
      // Mobile gets ~40 % of the particle budget.
      maxParticles: isMobile ? 90 : 220,
    });
    engineRef.current = engine;

    const resize = () => {
      const rect = frame.getBoundingClientRect();
      engine.resize(rect.width, rect.height);
      if (reduced) engine.renderStaticFrame();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(frame);

    // If the pin toggled active before the engine existed, catch up now.
    if (!reduced && pinActiveRef.current) engine.start();

    return () => {
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      id="stage-spray-drying"
      ref={ref as React.RefObject<HTMLElement>}
      aria-labelledby="stage-spray-drying-title"
      className="grain relative overflow-hidden bg-steel-deep"
    >
      <div className="container-site flex min-h-svh flex-col gap-4 pb-6 pt-[calc(var(--nav-height)+1.25rem)] md:grid md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-4">
          <StageCopy
            id="stage-spray-drying"
            num="08"
            kicker="SPRAY DRYING"
            title="Seconds from mist to powder"
            dark
          >
            <p>
              At the top of the tower, concentrate is atomized into millions
              of droplets and meets air at 185 °C. Water flashes off so fast
              that evaporative cooling keeps each droplet far below the air
              temperature while it dries — the milk itself is never scorched.
            </p>
            <p className="hidden sm:block">
              Dried particles fall to the cone; the cyclone recovers fines
              from the outlet air{texture === "instant" ? "; on the instant line, fines are re-wetted and lecithin is dosed over the fluid bed to build porous agglomerates" : ""}.
              Moisture leaves the tower at ≤ 4 %.
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {["inlet 185 °C", "outlet 88 °C", "moisture ≤ 4 %"].map((t) => (
                <li key={t} className="readout rounded border border-milk/25 px-2 py-1 !text-milk/70">
                  {t}
                </li>
              ))}
            </ul>
          </StageCopy>
        </div>

        <div className="relative min-h-0 flex-1 md:col-span-8">
          <div className="spray-readout absolute right-2 top-2 z-20 rounded-lg border border-milk/20 bg-steel-deep/85 px-3 py-2 font-mono text-xs text-milk/70 shadow-sm backdrop-blur-sm">
            <p>
              INLET AIR <span className="font-medium text-milk">185 °C</span>
            </p>
            <p className="mt-1">
              OUTLET AIR <span className="font-medium text-milk">88 °C</span>
            </p>
            <p className="mt-1">
              MOISTURE <span className="spray-moisture font-medium text-cream">3.5 %</span>
            </p>
          </div>

          {/* aspect-locked frame so canvas and SVG overlay exactly */}
          <div ref={frameRef} className="spray-scene relative mx-auto aspect-[900/720] max-h-[64vh] w-full max-w-full md:max-h-[80vh]">
            <svg
              viewBox="0 0 900 720"
              role="img"
              aria-label="Cutaway of a spray-drying tower: atomized concentrate meets 185 degree air, droplets dry into powder falling to the cone, a cyclone recovers fines and powder leaves the fluid bed at 3.5 percent moisture"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <linearGradient id="spray-steel" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" className="stop-steel-lo" />
                  <stop offset="50%" className="stop-steel-mid" />
                  <stop offset="100%" className="stop-steel-lo" />
                </linearGradient>
                <linearGradient id="spray-heat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className="stop-cream" stopOpacity="0.22" />
                  <stop offset="60%" className="stop-cream" stopOpacity="0.06" />
                  <stop offset="100%" className="stop-cream" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* ---- air heater + inlet duct ---- */}
              <g>
                <rect x="52" y="86" width="130" height="64" rx="8" fill="url(#spray-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.4" />
                <path className="spray-heat-el" d="M66,118 L82,102 L98,134 L114,102 L130,134 L146,102 L162,126" fill="none" stroke="rgb(var(--c-cream))" strokeWidth="4" strokeLinecap="round" />
                <text x="117" y="170" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="rgb(var(--c-milk))" opacity="0.7">
                  AIR HEATER
                </text>
                <path d="M182,112 L260,112 L288,132" fill="none" stroke="var(--m-steel-lo)" strokeWidth="10" opacity="0.8" />
                <path className="flow-dash-slow" d="M182,112 L260,112 L288,132" fill="none" stroke="rgb(var(--c-cream))" strokeWidth="3.5" opacity="0.7" />
              </g>

              {/* ---- tower cutaway ---- */}
              {/* interior */}
              <path d="M248,104 L552,104 L552,400 L418,542 L382,542 L248,400 Z" fill="rgb(var(--c-steel))" opacity="0.16" />
              {/* hot-air gradient inside the chamber */}
              <path className="spray-hot-air" d="M248,104 L552,104 L552,400 L418,542 L382,542 L248,400 Z" fill="url(#spray-heat)" />
              {/* walls */}
              <path d="M248,104 L248,400 L382,542 M552,104 L552,400 L418,542" fill="none" stroke="url(#spray-steel)" strokeWidth="9" strokeLinecap="round" />
              <ellipse cx="400" cy="104" rx="152" ry="18" fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="1.4" />

              {/* atomizer + air disperser */}
              <path d="M388,108 L412,108 L400,126 Z" fill="rgb(var(--c-cream))" />
              <path d="M348,116 A56,14 0 0 0 452,116" fill="none" stroke="var(--m-steel-hi)" strokeWidth="3" opacity="0.7" />
              <text x="570" y="120" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-milk))" opacity="0.6">
                atomizer
              </text>

              {/* concentrate feed line */}
              <path d="M400,0 L400,108" fill="none" stroke="var(--m-glass)" strokeWidth="9" opacity="0.35" />
              <path className="spray-feed" d="M400,0 L400,108" fill="none" stroke="var(--m-concentrate)" strokeWidth="5.5" />

              {/* ---- exhaust duct + cyclone ---- */}
              <g>
                <path d="M552,180 L640,180 L640,208" fill="none" stroke="var(--m-steel-lo)" strokeWidth="10" opacity="0.8" />
                <g className="spray-cyclone-flow">
                  <path className="flow-dash-slow" d="M552,180 L640,180 L640,208" fill="none" stroke="var(--m-glass)" strokeWidth="3.5" opacity="0.8" />
                </g>
                {/* cyclone body */}
                <rect x="608" y="208" width="76" height="92" rx="10" fill="url(#spray-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.4" />
                <path d="M612,300 L680,300 L652,412 L640,412 Z" fill="url(#spray-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.2" />
                {/* internal spiral */}
                <g className="spray-cyclone-flow">
                  <path className="flow-dash" d="M672,224 C640,232 628,258 646,282 C658,298 662,330 650,368" fill="none" stroke="var(--m-powder)" strokeWidth="2.5" opacity="0.8" />
                </g>
                <text x="646" y="196" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-milk))" opacity="0.6">
                  CYCLONE
                </text>
                {/* clean air out */}
                <path d="M646,208 L646,64 L760,64" fill="none" stroke="var(--m-steel-lo)" strokeWidth="8" opacity="0.55" />
                <text x="770" y="68" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-milk))" opacity="0.55">
                  exhaust air
                </text>
                {/* fines return to the tower */}
                <g className="spray-cyclone-flow">
                  <path className="flow-dash-slow" d="M646,412 L646,470 L470,470" fill="none" stroke="var(--m-powder)" strokeWidth="2.5" opacity="0.75" />
                  <text x="655" y="446" fontFamily="var(--font-mono)" fontSize="9" fill="rgb(var(--c-milk))" opacity="0.55">
                    fines return
                  </text>
                </g>
              </g>

              {/* ---- fluid bed + discharge ---- */}
              <g>
                <rect x="330" y="580" width="290" height="34" rx="8" fill="url(#spray-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.2" />
                {[352, 384, 416, 448, 480, 512, 544, 576].map((x) => (
                  <circle key={x} cx={x} cy="597" r="2" fill="rgb(var(--c-steel-deep))" opacity="0.6" />
                ))}
                <text x="475" y="636" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-milk))" opacity="0.6">
                  VIBRO FLUID BED · gentle after-drying &amp; cooling
                </text>
                {/* lecithin dosing on the instant line (branch-dependent) */}
                {texture === "instant" && (
                  <g>
                    <rect x="500" y="540" width="46" height="22" rx="5" fill="var(--m-steel-lo)" stroke="var(--m-steel-edge)" strokeWidth="1" />
                    <path className="flow-dash-slow" d="M523,562 L523,580" fill="none" stroke="rgb(var(--c-cream))" strokeWidth="3" />
                    <text x="554" y="556" fontFamily="var(--font-mono)" fontSize="9" fill="rgb(var(--c-cream))">
                      lecithin
                    </text>
                  </g>
                )}
                {/* tower outlet → bed → down the line */}
                <path d="M400,542 L400,580" fill="none" stroke="var(--m-steel-lo)" strokeWidth="8" opacity="0.7" />
                <path className="spray-discharge" d="M620,597 L700,597 L700,720" fill="none" stroke="var(--m-powder)" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
                <text className="spray-out-label" x="712" y="690" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-cream))">
                  powder · ≤ 4 % moisture
                </text>
              </g>
            </svg>

            {/* particle system lives exactly over the SVG */}
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
