"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";
import StageCopy from "./StageCopy";

// Vapour particle slots — deterministic so SSR markup matches the client.
const VAPOR = [
  { x: 380, delay: 0 },
  { x: 420, delay: 0.6 },
  { x: 460, delay: 1.4 },
  { x: 500, delay: 0.3 },
  { x: 540, delay: 1.9 },
  { x: 410, delay: 2.6 },
  { x: 480, delay: 3.1 },
  { x: 530, delay: 2.2 },
];

/**
 * Stage 4 — concentration. The evaporator's liquid level falls as vapour
 * rises, while the total-solids readout climbs from 12% to 48%.
 */
export default function StageConcentration() {
  const ref = useRef<HTMLElement>(null);
  const solidsRef = useRef<SVGTextElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const section = ref.current;
    if (!section) return;

    if (reduced) {
      if (solidsRef.current) solidsRef.current.textContent = "48%";
      return;
    }

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

      // Vessel sketches itself in.
      tl.fromTo(".evap-draw", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.26 }, 0.04);

      // Water leaves as vapour: liquid level drops over most of the scroll.
      tl.fromTo(
        ".evap-liquid",
        { scaleY: 1, transformOrigin: "center bottom" },
        { scaleY: 0.42, duration: 0.5, ease: "power1.inOut" },
        0.3
      );

      // Vapour only exists while evaporation is happening.
      tl.fromTo(".evap-vapor", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.3);

      // Total solids concentration counts up as moisture leaves.
      const solids = { value: 12 };
      tl.to(
        solids,
        {
          value: 48,
          duration: 0.5,
          ease: "power1.inOut",
          onUpdate: () => {
            if (solidsRef.current) solidsRef.current.textContent = `${Math.round(solids.value)}%`;
          },
        },
        0.3
      );

      tl.fromTo(".evap-out", { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.84);
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={ref} className={`relative grain bg-deep-900 ${reduced ? "" : "h-[180vh]"}`}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="container-site grid w-full items-center gap-10 py-20 lg:grid-cols-2 lg:gap-16">
          <div className="relative order-last lg:order-first">
            <svg viewBox="0 0 900 560" className="w-full" role="img" aria-label="Evaporator removing moisture to concentrate the milk">
              <defs>
                <linearGradient id="c4-liquid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFFFFF" />
                  <stop offset="1" stopColor="#DDE8F2" />
                </linearGradient>
              </defs>

              <rect width="900" height="560" rx="24" fill="#071F38" />

              {/* rising vapour (CSS loop, gated by scroll) */}
              <g className="evap-vapor" opacity="0">
                {VAPOR.map((v, i) => (
                  <circle
                    key={i}
                    className="vapor"
                    cx={v.x}
                    cy="180"
                    r={5 + (i % 3) * 2}
                    fill="#AFC9E5"
                    style={{ animationDelay: `${v.delay}s` }}
                  />
                ))}
              </g>

              {/* evaporator vessel */}
              <path
                className="evap-draw"
                d="M330 160 h260 v200 q0 40 -40 56 l-60 24 q-30 12 -60 0 l-60 -24 q-40 -16 -40 -56 Z"
                fill="none"
                stroke="#7FA8D3"
                strokeWidth="4"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset="1"
              />
              {/* liquid inside (level falls on scroll) */}
              <g>
                <clipPath id="c4-clip">
                  <path d="M336 166 h248 v194 q0 36 -36 50 l-60 24 q-28 11 -56 0 l-60 -24 q-36 -14 -36 -50 Z" />
                </clipPath>
                <rect className="evap-liquid" x="336" y="210" width="248" height="260" fill="url(#c4-liquid)" clipPath="url(#c4-clip)" />
              </g>

              {/* vacuum line + label */}
              <line x1="590" y1="200" x2="700" y2="200" stroke="#2D659F" strokeWidth="3" strokeDasharray="8 8" />
              <text x="710" y="205" fontSize="14" fill="#7FA8D3" letterSpacing="1">
                VACUUM
              </text>

              {/* total solids readout */}
              <g>
                <rect x="640" y="280" width="180" height="120" rx="14" fill="#0A2E52" stroke="#2D659F" strokeWidth="2" />
                <text x="730" y="316" textAnchor="middle" fontSize="13" letterSpacing="2" fill="#7FA8D3">
                  TOTAL SOLIDS
                </text>
                <text ref={solidsRef} x="730" y="372" textAnchor="middle" fontSize="44" fontWeight="700" fill="#FFF7E8">
                  12%
                </text>
              </g>

              {/* concentrate outlet */}
              <g className="evap-out">
                <line x1="460" y1="452" x2="460" y2="500" stroke="#C9A96A" strokeWidth="5" strokeLinecap="round" />
                <path d="M448 492 l12 16 12 -16" fill="none" stroke="#C9A96A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                <text x="490" y="505" fontSize="14" fill="#C9A96A" letterSpacing="1.5">
                  CONCENTRATED MILK BASE
                </text>
              </g>
            </svg>
          </div>

          <StageCopy
            index={4}
            kicker="Concentration"
            title="Water leaves. Everything good stays."
            text="Excess moisture is removed to create a concentrated milk base."
            tone="dark"
          />
        </div>
      </div>
    </section>
  );
}
