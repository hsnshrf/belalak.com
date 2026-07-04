"use client";

import { counterTween, useStagePin } from "@/lib/stageAnimation";
import StageCopy from "./StageCopy";

/** Wheel rendered around local (0,0) so GSAP can spin it in place. */
function Wheel() {
  return (
    <g className="transport-wheel">
      <circle r="13" fill="rgb(var(--c-steel-deep))" />
      <circle r="7" fill="var(--m-steel-mid)" />
      <g stroke="var(--m-steel-hi)" strokeWidth="1.6">
        <line x1="-6" y1="0" x2="6" y2="0" />
        <line x1="0" y1="-6" x2="0" y2="6" />
        <line x1="-4.2" y1="-4.2" x2="4.2" y2="4.2" />
      </g>
      <circle r="2" fill="var(--m-steel-edge)" />
    </g>
  );
}

/**
 * STAGE 02 — Cold-chain transport.
 *
 * Choreography (scrubbed): landscape fades in; the insulated tanker drives
 * the full width of the scene while hills parallax against it, wheels spin
 * proportionally to distance, road dashes stream past, the km counter runs
 * up and the tank temperature holds at 4.0 °C. The factory brightens as
 * the truck reaches the reception bay.
 */
export default function Stage02Transport() {
  const ref = useStagePin({
    id: "stage-transport",
    length: 2200,
    build: ({ tl, q }) => {
      tl.fromTo(q(".tr-scene"), { opacity: 0 }, { opacity: 1, duration: 0.4 })
        .fromTo(q(".stage-copy"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, 0.05)
        .fromTo(q(".tr-readout"), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4 }, 0.3);

      // The drive: truck, wheels, road dashes and parallax move together.
      tl.fromTo(q(".tr-truck"), { x: -300 }, { x: 468, duration: 2.4 }, 0.5)
        .to(q(".transport-wheel"), { rotation: 4 * 360, duration: 2.4 }, "<")
        .fromTo(q(".tr-centerline"), { strokeDashoffset: 0 }, { strokeDashoffset: -760, duration: 2.4 }, "<")
        .fromTo(q(".tr-back"), { x: 0 }, { x: -36, duration: 2.4 }, "<")
        .fromTo(q(".tr-mid"), { x: 0 }, { x: -80, duration: 2.4 }, "<");

      const km = q(".tr-km")[0];
      if (km) tl.add(counterTween(km, { from: 0, to: 112, decimals: 0, duration: 2.4 }), "<");

      // Arrival: factory reception brightens.
      tl.fromTo(q(".tr-factory"), { opacity: 0.45 }, { opacity: 1, duration: 0.4 }, "-=0.5");
    },
  });

  return (
    <section
      id="stage-transport"
      ref={ref as React.RefObject<HTMLElement>}
      aria-labelledby="stage-transport-title"
      className="relative overflow-hidden bg-milk"
    >
      <div className="container-site flex min-h-svh flex-col gap-4 pb-6 pt-[calc(var(--nav-height)+1.25rem)] md:grid md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-4">
          <StageCopy
            id="stage-transport"
            num="02"
            kicker="COLD CHAIN"
            title="Farm to factory, never above 4 °C"
          >
            <p>
              Chilled milk is loaded into insulated stainless-steel tankers,
              sealed at the farm and driven straight to the plant. Insulation
              — not refrigeration — holds the temperature: a short, direct
              run matters, and Belarus&apos;s dense farm network keeps it short.
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {["insulated stainless tanker", "sealed at the farm", "≤ 4 °C on arrival"].map((t) => (
                <li key={t} className="readout rounded border border-steel/25 px-2 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </StageCopy>
        </div>

        <div className="relative min-h-0 flex-1 md:col-span-8">
          {/* live transport readout */}
          <div className="tr-readout absolute right-2 top-2 z-10 rounded-lg border border-steel/20 bg-milk/90 px-3 py-2 font-mono text-xs shadow-sm">
            <p className="flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-pasture" />
              TANK TEMP <span className="font-medium text-ink">4.0 °C</span>
            </p>
            <p className="mt-1 text-steel">
              DISTANCE <span className="tr-km font-medium text-ink">112</span> km
            </p>
          </div>

          <svg
            viewBox="0 0 960 540"
            role="img"
            aria-label="An insulated stainless-steel milk tanker driving across a Belarusian landscape from the farm to the factory, tank temperature holding at 4 degrees Celsius"
            className="tr-scene mx-auto h-full max-h-[62vh] w-full md:max-h-[78vh]"
          >
            <defs>
              <linearGradient id="tr-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="stop-glass" />
                <stop offset="100%" className="stop-milk" />
              </linearGradient>
              <linearGradient id="tr-tank" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="stop-steel-hi" />
                <stop offset="50%" className="stop-steel-mid" />
                <stop offset="100%" className="stop-steel-lo" />
              </linearGradient>
            </defs>

            {/* distant layer */}
            <g className="tr-back">
              <rect x="-60" y="0" width="1080" height="360" fill="url(#tr-sky)" />
              <path d="M-60,268 Q180,240 420,262 T900,254 T1020,262 L1020,380 L-60,380 Z" fill="rgb(var(--c-pasture))" opacity="0.2" />
            </g>

            {/* mid layer: fields, birch row, farm silhouette */}
            <g className="tr-mid">
              <path d="M-100,330 Q240,306 560,326 T1060,318 L1060,540 L-100,540 Z" fill="rgb(var(--c-pasture))" opacity="0.35" />
              {[140, 175, 420, 455, 490].map((x, i) => (
                <g key={x} transform={`translate(${x} ${268 - (i % 2) * 6})`}>
                  <rect x="-2" y="0" width="4" height="52" rx="2" fill="var(--m-milk-raw)" stroke="rgb(var(--c-steel))" strokeOpacity="0.35" strokeWidth="0.5" />
                  {[8, 22, 36].map((y) => (
                    <rect key={y} x="-2" y={y} width="2.6" height="2.6" fill="rgb(var(--c-steel-deep))" opacity="0.5" />
                  ))}
                  <ellipse cx="0" cy="-8" rx="13" ry="12" fill="rgb(var(--c-pasture))" opacity="0.45" />
                </g>
              ))}
              {/* the farm we just left */}
              <g transform="translate(18 300)" opacity="0.75">
                <path d="M0,60 L0,20 L34,0 L68,20 L68,60 Z" fill="rgb(var(--c-ivory))" stroke="rgb(var(--c-steel))" strokeOpacity="0.4" />
                <path d="M0,20 L34,0 L68,20" fill="none" stroke="var(--m-steel-lo)" strokeWidth="5" />
                <rect x="26" y="38" width="16" height="22" fill="var(--m-steel-lo)" opacity="0.7" />
              </g>
            </g>

            {/* factory at the right edge */}
            <g className="tr-factory">
              <rect x="712" y="318" width="180" height="102" fill="rgb(var(--c-ivory))" stroke="var(--m-steel-lo)" strokeWidth="1.5" />
              <rect x="712" y="308" width="180" height="12" fill="var(--m-steel-mid)" />
              {/* spray tower silhouette */}
              <rect x="900" y="192" width="44" height="170" rx="10" fill="url(#tr-tank)" stroke="var(--m-steel-edge)" strokeWidth="1" />
              <path d="M902,360 L942,360 L928,412 L916,412 Z" fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="1" />
              <rect x="856" y="238" width="10" height="80" fill="var(--m-steel-lo)" />
              <text x="802" y="358" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fill="rgb(var(--c-steel))">
                BELALAK PLANT
              </text>
              {/* reception bay */}
              <rect x="712" y="388" width="64" height="32" fill="var(--m-steel-lo)" opacity="0.5" />
              <text x="744" y="380" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="rgb(var(--c-steel))">
                RECEPTION
              </text>
            </g>

            {/* road */}
            <g>
              <rect x="-60" y="452" width="1080" height="52" fill="rgb(var(--c-steel-deep))" opacity="0.88" />
              <line className="tr-centerline" x1="-60" y1="478" x2="1020" y2="478" stroke="rgb(var(--c-milk))" strokeWidth="3" strokeDasharray="26 22" opacity="0.7" />
            </g>

            {/* the tanker — authored at its arrival position (final state for
                reduced motion); the timeline drives it in from off-screen */}
            <g className="tr-truck" transform="translate(468 0)">
              <g transform="translate(160 452)">
                {/* chassis */}
                <rect x="0" y="-50" width="252" height="9" fill="var(--m-steel-edge)" />
                {/* insulated tank barrel */}
                <rect x="0" y="-100" width="172" height="50" rx="25" fill="url(#tr-tank)" stroke="var(--m-steel-edge)" strokeWidth="1.4" />
                <ellipse cx="86" cy="-88" rx="70" ry="7" fill="var(--m-steel-hi)" opacity="0.55" />
                {/* manway domes + rear ladder */}
                <rect x="42" y="-106" width="20" height="7" rx="3.5" fill="var(--m-steel-lo)" />
                <rect x="104" y="-106" width="20" height="7" rx="3.5" fill="var(--m-steel-lo)" />
                <g stroke="var(--m-steel-edge)" strokeWidth="1.6">
                  <line x1="6" y1="-96" x2="6" y2="-52" />
                  <line x1="12" y1="-96" x2="12" y2="-52" />
                  {[-90, -78, -66, -56].map((y) => (
                    <line key={y} x1="6" y1={y} x2="12" y2={y} />
                  ))}
                </g>
                <text x="86" y="-68" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="15" fill="rgb(var(--c-steel))" letterSpacing="2">
                  BELALAK
                </text>
                {/* tractor unit */}
                <path d="M196,-50 L196,-98 L214,-112 L246,-112 C252,-112 254,-106 254,-100 L254,-50 Z" fill="rgb(var(--c-steel))" />
                <path d="M217,-108 L243,-108 L243,-88 L209,-88 Z" fill="var(--m-glass)" />
                <rect x="246" y="-84" width="8" height="22" rx="2" fill="var(--m-steel-lo)" />
                <rect x="200" y="-64" width="34" height="14" rx="3" fill="var(--m-steel-lo)" opacity="0.7" />
                {/* wheels: trailer tri-axle + tractor axles */}
                <g transform="translate(28 -8)"><Wheel /></g>
                <g transform="translate(58 -8)"><Wheel /></g>
                <g transform="translate(88 -8)"><Wheel /></g>
                <g transform="translate(196 -8)"><Wheel /></g>
                <g transform="translate(236 -8)"><Wheel /></g>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
