"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";
import {
  FALLBACK_TEXTURE,
  useJourneyState,
  type TextureChoice,
} from "@/lib/journeyState";
import { counterTween, drawTween, useStagePin } from "@/lib/stageAnimation";
import ChoiceCards from "./ChoiceCards";
import StageCopy from "./StageCopy";

/**
 * STAGE 07 — DECISION POINT #2: instantized or regular?
 *
 * Same pattern as stage 05: the scrub timeline sets the scene and dwells;
 * choosing plays a non-scrubbed branch animation and writes the store.
 *
 * INSTANT: lecithin is dosed onto the line and the particle window shows
 * fines clustering into porous agglomerates; the beaker demo dissolves a
 * spoonful almost immediately.
 * REGULAR: straight-through — fine free-flowing powder; the beaker demo
 * disperses slowly with clumps lingering at the surface.
 */
export default function Stage07Instantizing() {
  const texture = useJourneyState((s) => s.texture);
  const setTexture = useJourneyState((s) => s.setTexture);
  const reduced = usePrefersReducedMotion();
  const branchTl = useRef<gsap.core.Timeline | null>(null);

  const ref = useStagePin({
    id: "stage-instantizing",
    length: 2400,
    onLeave: () => {
      if (!useJourneyState.getState().texture)
        setTexture(FALLBACK_TEXTURE, true);
    },
    build: ({ tl, q }) => {
      tl.fromTo(q(".stage-copy"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, 0)
        .fromTo(q(".ins-scene"), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1);
      const line = q(".ins-feed-line")[0];
      if (line) tl.add(drawTween(line, { duration: 0.5 }));
      tl.fromTo(q(".ins-cards"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4 }, "-=0.1");
      tl.to({}, { duration: 1.6 }); // dwell for the decision
    },
  });

  useEffect(() => {
    if (!texture) return;
    const root = ref.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    branchTl.current?.kill();
    const d = reduced ? 0 : 1;
    const tl = gsap.timeline();
    branchTl.current = tl;

    if (texture === "instant") {
      tl.to(q(".ins-vis-regular"), { opacity: 0, duration: 0.2 * d }, 0)
        .to(q(".ins-vis-instant"), { opacity: 1, duration: 0.25 * d }, 0);
      // lecithin dosing
      const drip = q(".ins-lecithin-drip")[0];
      if (drip) tl.add(drawTween(drip, { duration: 0.4 * d }), 0.15 * d);
      // agglomeration: fines converge into porous clusters
      tl.fromTo(
        q(".ins-agg-dot"),
        {
          x: (i) => [-26, 22, -18, 30, -32, 14, 26, -12, 8, -22, 18, -8][i % 12],
          y: (i) => [-20, -28, 24, 12, 6, -16, 22, 30, -30, -8, 14, 26][i % 12],
          opacity: 0.55,
        },
        { x: 0, y: 0, opacity: 1, duration: 0.7 * d, ease: "power2.inOut", stagger: 0.02 * d }
      );
      // beaker: powder sinks fast, water turns milky, 15 s timer
      tl.fromTo(
        q(".ins-i-powder circle"),
        { y: -46, opacity: 1 },
        { y: 6, opacity: 0, duration: 0.5 * d, stagger: 0.05 * d, ease: "power1.in" },
        "<"
      );
      tl.fromTo(q(".ins-i-water"), { opacity: 0.18 }, { opacity: 0.9, duration: 0.5 * d }, "<0.2");
      const t = q(".ins-i-timer")[0];
      if (t) tl.add(counterTween(t, { from: 0, to: 15, decimals: 0, suffix: " s — fully dispersed", duration: 0.6 * d }), "<");
    } else {
      tl.to(q(".ins-vis-instant"), { opacity: 0, duration: 0.2 * d }, 0)
        .to(q(".ins-vis-regular"), { opacity: 1, duration: 0.25 * d }, 0);
      // beaker: slow dispersion, clumps linger
      tl.fromTo(
        q(".ins-r-powder circle"),
        { y: -46, opacity: 1 },
        { y: -8, opacity: 0.9, duration: 0.9 * d, stagger: 0.08 * d, ease: "power1.in" },
        0.15 * d
      );
      tl.fromTo(q(".ins-r-clumps"), { opacity: 0 }, { opacity: 1, duration: 0.4 * d }, "<0.3");
      tl.fromTo(q(".ins-r-water"), { opacity: 0.18 }, { opacity: 0.6, duration: 1.2 * d }, "<");
      const t = q(".ins-r-timer")[0];
      if (t) tl.add(counterTween(t, { from: 0, to: 90, decimals: 0, suffix: " s — stir to disperse", duration: 1.2 * d }), "<");
    }
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, reduced]);

  return (
    <section
      id="stage-instantizing"
      ref={ref as React.RefObject<HTMLElement>}
      aria-labelledby="stage-instantizing-title"
      className="relative overflow-hidden bg-ivory"
    >
      <div className="container-site flex min-h-svh flex-col gap-4 pb-6 pt-[calc(var(--nav-height)+1.25rem)] md:grid md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-4">
          <StageCopy
            id="stage-instantizing"
            num="07"
            kicker="DECISION № 2 · INSTANTIZING"
            title="Instant in the cup — or nothing added?"
          >
            <p>
              Instantized powder is agglomerated and dosed with food-grade
              lecithin (≤ 0.5 %): fine particles cluster into porous granules
              that wet, sink and dissolve without stirring. Regular powder
              stays a pure, single-ingredient product — milk and nothing else.
            </p>
            <p className="readout !text-cream">
              THIS SETS THE DRYING LINE AND YOUR FINAL PRODUCT.
            </p>
          </StageCopy>
        </div>

        <div className="min-h-0 flex-1 md:col-span-8">
          <svg
            viewBox="0 0 900 500"
            role="img"
            aria-label="Concentrate line heading to the spray drier with a lecithin dosing skid, a magnified particle window showing agglomeration, and a beaker demo comparing instant versus regular dissolution"
            className="ins-scene mx-auto h-full max-h-[44vh] w-full md:max-h-[52vh]"
          >
            <defs>
              <linearGradient id="ins-steel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="stop-steel-hi" />
                <stop offset="100%" className="stop-steel-lo" />
              </linearGradient>
            </defs>

            {/* concentrate feed line toward the drier */}
            <path d="M0,90 L900,90" fill="none" stroke="var(--m-glass)" strokeWidth="9" opacity="0.5" />
            <path className="ins-feed-line" d="M0,90 L900,90" fill="none" stroke="var(--m-concentrate)" strokeWidth="5.5" />
            <text x="874" y="76" textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-steel))">
              → to spray drier
            </text>

            {/* lecithin dosing skid (activates on the INSTANT branch) */}
            <g>
              <rect x="416" y="8" width="68" height="42" rx="8" fill="url(#ins-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.2" />
              <text x="450" y="34" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="rgb(var(--c-steel-deep))">
                LECITHIN
              </text>
              <rect x="444" y="50" width="12" height="10" rx="2" fill="var(--m-steel-lo)" />
            </g>

            {/* magnified particle window */}
            <g>
              <circle cx="190" cy="330" r="104" fill="rgb(var(--c-milk))" stroke="var(--m-steel-lo)" strokeWidth="2" strokeDasharray="5 6" />
              <line x1="262" y1="256" x2="330" y2="120" stroke="var(--m-steel-lo)" strokeWidth="1.4" strokeDasharray="4 5" opacity="0.7" />
              <text x="190" y="452" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="rgb(var(--c-steel))">
                PARTICLE VIEW ×400
              </text>
            </g>

            {/* ---- INSTANT branch ---- */}
            <g className="ins-vis-instant" opacity="0">
              {/* lecithin drip onto the line */}
              <path className="ins-lecithin-drip" d="M450,60 L450,86" fill="none" stroke="rgb(var(--c-cream))" strokeWidth="4" strokeLinecap="round" />
              <circle cx="450" cy="90" r="6" fill="rgb(var(--c-cream))" opacity="0.85" />
              <text x="466" y="62" fontFamily="var(--font-mono)" fontSize="9" fill="var(--m-cream-deep)">
                dosing ≤ 0.5 %
              </text>
              {/* porous agglomerates in the window */}
              {[
                { cx: 150, cy: 300 },
                { cx: 232, cy: 322 },
                { cx: 176, cy: 376 },
              ].map((c, ci) => (
                <g key={ci}>
                  {[0, 1, 2, 3].map((pi) => {
                    const a = (pi / 4) * Math.PI * 2 + ci;
                    return (
                      <circle
                        key={pi}
                        className="ins-agg-dot"
                        cx={c.cx + Math.round(Math.cos(a) * 9 * 100) / 100}
                        cy={c.cy + Math.round(Math.sin(a) * 9 * 100) / 100}
                        r="7"
                        fill="var(--m-powder)"
                        stroke="var(--m-cream-deep)"
                        strokeWidth="1.4"
                      />
                    );
                  })}
                </g>
              ))}
              <text x="190" y="430" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--m-cream-deep)">
                porous agglomerates · lecithin coat
              </text>

              {/* beaker demo — instant */}
              <g transform="translate(560 0)">
                <path d="M90,250 L90,420 Q90,432 102,432 L218,432 Q230,432 230,420 L230,250" fill="none" stroke="var(--m-glass)" strokeWidth="5" strokeLinecap="round" />
                <rect className="ins-i-water" x="94" y="330" width="132" height="98" rx="6" fill="var(--m-milk-raw)" opacity="0.9" />
                {/* spoon */}
                <g transform="translate(160 236) rotate(-18)">
                  <rect x="16" y="-4" width="64" height="5" rx="2.5" fill="var(--m-steel-mid)" />
                  <ellipse cx="6" cy="0" rx="14" ry="7" fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="0.8" />
                </g>
                <g className="ins-i-powder">
                  {[136, 148, 158, 168, 178].map((x, i) => (
                    <circle key={x} cx={x} cy={300 + (i % 3) * 8} r="3" fill="var(--m-powder)" stroke="var(--m-steel-lo)" strokeWidth="0.5" />
                  ))}
                </g>
                <text className="ins-i-timer" x="160" y="466" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="rgb(var(--c-pasture))">
                  15 s — fully dispersed
                </text>
              </g>
            </g>

            {/* ---- REGULAR branch ---- */}
            <g className="ins-vis-regular" opacity="0">
              {/* fine, even, free-flowing particles in the window */}
              {[
                [138, 292], [172, 276], [210, 296], [242, 318], [150, 330],
                [190, 318], [228, 352], [160, 366], [198, 380], [232, 386],
                [128, 352], [186, 346],
              ].map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" fill="var(--m-powder)" stroke="var(--m-steel-lo)" strokeWidth="1" />
              ))}
              <text x="190" y="430" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="rgb(var(--c-steel))">
                fine free-flowing powder · nothing added
              </text>

              {/* beaker demo — regular */}
              <g transform="translate(560 0)">
                <path d="M90,250 L90,420 Q90,432 102,432 L218,432 Q230,432 230,420 L230,250" fill="none" stroke="var(--m-glass)" strokeWidth="5" strokeLinecap="round" />
                <rect className="ins-r-water" x="94" y="330" width="132" height="98" rx="6" fill="var(--m-milk-raw)" opacity="0.6" />
                <g transform="translate(160 236) rotate(-18)">
                  <rect x="16" y="-4" width="64" height="5" rx="2.5" fill="var(--m-steel-mid)" />
                  <ellipse cx="6" cy="0" rx="14" ry="7" fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="0.8" />
                </g>
                <g className="ins-r-powder">
                  {[136, 148, 158, 168, 178].map((x, i) => (
                    <circle key={x} cx={x} cy={300 + (i % 3) * 8} r="3" fill="var(--m-powder)" stroke="var(--m-steel-lo)" strokeWidth="0.5" />
                  ))}
                </g>
                {/* clumps lingering at the surface */}
                <g className="ins-r-clumps">
                  <ellipse cx="130" cy="332" rx="11" ry="5" fill="var(--m-powder)" stroke="var(--m-steel-lo)" strokeWidth="1" />
                  <ellipse cx="182" cy="330" rx="14" ry="6" fill="var(--m-powder)" stroke="var(--m-steel-lo)" strokeWidth="1" />
                </g>
                <text className="ins-r-timer" x="160" y="466" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="rgb(var(--c-steel))">
                  90 s — stir to disperse
                </text>
              </g>
            </g>
          </svg>

          <div className="ins-cards mt-4">
            <ChoiceCards<TextureChoice>
              label="Decision two: choose instantized or regular powder"
              value={texture}
              onChoose={(v) => setTexture(v)}
              choices={[
                {
                  value: "instant",
                  title: "Instantized (with lecithin)",
                  body: "Agglomerated + lecithinated for instant wettability. Ideal for beverages and reconstitution.",
                  tag: "→ INSTANT GRADE",
                },
                {
                  value: "regular",
                  title: "Regular (nothing added)",
                  body: "Pure single-ingredient milk powder for recombination, bakery, confectionery and processing.",
                  tag: "→ REGULAR GRADE",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
