"use client";

import { counterTween, drawTween, useStagePin } from "@/lib/stageAnimation";
import StageCopy from "./StageCopy";

/**
 * STAGE 04 — HTST pasteurization in a plate heat exchanger.
 *
 * Choreography: the frame and plate pack rise in; milk draws through the
 * lower channel into the heating section while the temperature readout
 * climbs 4 → 72.5 °C and the heating plates glow warm; the flow loops
 * through the external holding tube while the hold timer runs 0 → 15 s
 * (pathogen-kill badge stamps); then it returns through regeneration and
 * the outlet readout falls back to 4 °C as the stream continues downward.
 */
export default function Stage04Pasteurization() {
  const ref = useStagePin({
    id: "stage-pasteurization",
    length: 2600,
    build: ({ tl, q }) => {
      tl.fromTo(q(".stage-copy"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, 0)
        .fromTo(q(".past-machine"), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1)
        .fromTo(q(".past-readout"), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, 0.3);

      // Leg 1 — into the heating section: milk warms 4 → 72.5 °C.
      const [leg1, leg2, leg3] = q(".past-milk");
      const temp = q(".past-temp")[0];
      const hold = q(".past-hold")[0];
      const out = q(".past-out")[0];

      if (leg1) tl.add(drawTween(leg1, { duration: 0.9 }), "+=0.1");
      if (temp) {
        tl.add(counterTween(temp, { from: 4, to: 72.5, decimals: 1, suffix: " °C", duration: 0.9 }), "<");
      }
      tl.fromTo(q(".past-heat-glow"), { opacity: 0 }, { opacity: 0.5, duration: 0.6 }, "<0.2");

      // Leg 2 — the holding tube: 15 seconds at temperature.
      if (leg2) tl.add(drawTween(leg2, { duration: 0.6 }));
      if (hold) {
        tl.add(counterTween(hold, { from: 0, to: 15, decimals: 1, suffix: " s", duration: 0.6 }), "<");
      }
      tl.fromTo(
        q(".past-kill"),
        { opacity: 0, scale: 0.85, transformOrigin: "left center" },
        { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(1.7)" }
      );

      // Leg 3 — regeneration + cooling: outlet back down to 4 °C.
      if (leg3) tl.add(drawTween(leg3, { duration: 0.9 }), "+=0.05");
      if (out) {
        tl.add(counterTween(out, { from: 72.5, to: 4, decimals: 1, suffix: " °C", duration: 0.9 }), "<");
      }
    },
  });

  const plateXs = Array.from({ length: 17 }, (_, i) => 250 + i * 28);

  return (
    <section
      id="stage-pasteurization"
      ref={ref as React.RefObject<HTMLElement>}
      aria-labelledby="stage-pasteurization-title"
      className="relative overflow-hidden bg-milk"
    >
      <div className="container-site flex min-h-svh flex-col gap-4 pb-6 pt-[calc(var(--nav-height)+1.25rem)] md:grid md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-4">
          <StageCopy
            id="stage-pasteurization"
            num="04"
            kicker="HTST"
            title="Pasteurization: 72.5 °C for 15 seconds"
          >
            <p>
              A plate heat exchanger takes the milk from 4 °C to 72.5 °C,
              holds it there for 15 seconds, then chills it straight back.
              High temperature, short time: pathogens are destroyed while
              proteins and vitamins stay functional.
            </p>
            <p className="hidden sm:block">
              Regeneration sections reuse the outgoing heat to warm incoming
              milk — over 90 % of the energy is recovered.
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {["72–75 °C", "15–20 s hold", "back to 4 °C"].map((t) => (
                <li key={t} className="readout rounded border border-steel/25 px-2 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </StageCopy>
        </div>

        <div className="relative min-h-0 flex-1 md:col-span-8">
          {/* instrument panel */}
          <div className="past-readout absolute right-2 top-2 z-10 rounded-lg border border-steel/20 bg-milk/90 px-3 py-2 font-mono text-xs shadow-sm">
            <p className="text-steel">
              MILK TEMP <span className="past-temp font-medium text-ink">72.5 °C</span>
            </p>
            <p className="mt-1 text-steel">
              HOLD <span className="past-hold font-medium text-ink">15.0 s</span>
            </p>
            <p className="mt-1 text-steel">
              OUTLET <span className="past-out font-medium text-ink">4.0 °C</span>
            </p>
            <p className="past-kill mt-1.5 border-t border-steel/15 pt-1.5 text-[0.65rem] font-semibold text-pasture">
              ✓ PATHOGENS DESTROYED
            </p>
          </div>

          <svg
            viewBox="0 0 960 600"
            role="img"
            aria-label="Cutaway of a plate heat exchanger: milk flows through the plate pack, heats to 72.5 degrees, holds in an external tube for 15 seconds, then cools back to 4 degrees"
            className="past-machine mx-auto h-full max-h-[62vh] w-full md:max-h-[78vh]"
          >
            <defs>
              <linearGradient id="past-plate" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" className="stop-steel-hi" />
                <stop offset="55%" className="stop-steel-mid" />
                <stop offset="100%" className="stop-steel-lo" />
              </linearGradient>
              <linearGradient id="past-head" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="stop-steel-mid" />
                <stop offset="100%" className="stop-steel-lo" />
              </linearGradient>
              {/* milk warms left → right; the return leg re-crosses to cool */}
              <linearGradient id="past-milkgrad" x1="150" y1="0" x2="840" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" className="stop-milk-cool" />
                <stop offset="55%" className="stop-milk-raw" />
                <stop offset="100%" className="stop-milk-warm" />
              </linearGradient>
            </defs>

            {/* frame: base, carrying bar, head plates, tie bolts */}
            <rect x="170" y="500" width="640" height="14" rx="3" fill="var(--m-steel-lo)" />
            <rect x="210" y="118" width="560" height="10" rx="3" fill="var(--m-steel-mid)" />
            <rect x="196" y="150" width="30" height="350" rx="3" fill="url(#past-head)" stroke="var(--m-steel-edge)" strokeWidth="1.4" />
            <rect x="756" y="150" width="30" height="350" rx="3" fill="url(#past-head)" stroke="var(--m-steel-edge)" strokeWidth="1.4" />
            <line x1="226" y1="230" x2="756" y2="230" stroke="var(--m-steel-edge)" strokeWidth="4" opacity="0.5" />
            <line x1="226" y1="440" x2="756" y2="440" stroke="var(--m-steel-edge)" strokeWidth="4" opacity="0.5" />

            {/* plate pack */}
            {plateXs.map((x, i) => (
              <rect
                key={x}
                x={x}
                y={162}
                width="13"
                height="326"
                rx="3"
                fill="url(#past-plate)"
                stroke="var(--m-steel-edge)"
                strokeWidth="0.7"
                opacity={i % 2 ? 0.92 : 1}
              />
            ))}

            {/* heating-section glow (right third of the pack) */}
            <rect className="past-heat-glow" x="560" y="162" width="180" height="326" fill="var(--m-milk-warm)" opacity="0.5" />

            {/* section labels */}
            <g fontFamily="var(--font-mono)" fontSize="11" fill="rgb(var(--c-steel))">
              <text x="340" y="540" textAnchor="middle">REGENERATION</text>
              <text x="620" y="540" textAnchor="middle">HEATING</text>
              <text x="600" y="42" textAnchor="middle">HOLDING TUBE · 15 s</text>
              <line x1="540" y1="520" x2="540" y2="548" stroke="rgb(var(--c-steel))" strokeOpacity="0.3" strokeDasharray="3 4" />
            </g>

            {/* hot-water counter-flow in the heating section */}
            <path className="flow-dash-slow" d="M740,470 L740,180" fill="none" stroke="rgb(var(--c-cream))" strokeWidth="4" opacity="0.55" />
            <text x="800" y="566" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-steel))">hot water ↑</text>

            {/* glass backing for the milk path */}
            <g fill="none" stroke="var(--m-glass)" strokeWidth="10" opacity="0.55" strokeLinecap="round">
              <path d="M150,450 L640,450 L640,120" />
              <path d="M640,120 C640,66 700,60 730,60 L830,60 C856,60 856,104 830,104 L700,104" />
              <path d="M700,104 L700,190 L170,190 L170,560" />
            </g>

            {/* the milk itself — three legs drawn in sequence */}
            <g fill="none" strokeWidth="6" strokeLinecap="round">
              <path className="past-milk" d="M150,450 L640,450 L640,120" stroke="url(#past-milkgrad)" />
              <path className="past-milk" d="M640,120 C640,66 700,60 730,60 L830,60 C856,60 856,104 830,104 L700,104" stroke="var(--m-milk-warm)" />
              <path className="past-milk" d="M700,104 L700,190 L170,190 L170,560" stroke="url(#past-milkgrad)" />
            </g>

            {/* ports */}
            <circle cx="150" cy="450" r="9" fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="1.5" />
            <circle cx="170" cy="190" r="9" fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="1.5" />
            <text x="120" y="480" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-steel))">raw in · 4 °C</text>
            <text x="196" y="580" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-steel))">pasteurized out · 4 °C</text>
          </svg>
        </div>
      </div>
    </section>
  );
}
