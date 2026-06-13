"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";
import StageCopy from "./StageCopy";

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
  const ref       = useRef<HTMLElement>(null);
  const solidsRef = useRef<SVGTextElement>(null);
  const reduced   = usePrefersReducedMotion();

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

      tl.fromTo(".evap-draw", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.26 }, 0.04);

      tl.fromTo(
        ".evap-liquid",
        { scaleY: 1, transformOrigin: "center bottom" },
        { scaleY: 0.42, duration: 0.5, ease: "power1.inOut" },
        0.3
      );

      tl.fromTo(".evap-vapor", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.3);

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
            <svg viewBox="0 0 900 560" className="w-full" role="img"
                 aria-label="Industrial evaporator removing moisture from concentrated milk">
              <defs>
                {/* Cylindrical vessel shading */}
                <linearGradient id="c4-vessel" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#1A3A54"/>
                  <stop offset="15%"  stopColor="#2A5878"/>
                  <stop offset="40%"  stopColor="#4878A0"/>
                  <stop offset="55%"  stopColor="#5888B0"/>
                  <stop offset="75%"  stopColor="#3A6888"/>
                  <stop offset="90%"  stopColor="#1E4060"/>
                  <stop offset="100%" stopColor="#0E2A40"/>
                </linearGradient>

                {/* Insulation jacket */}
                <linearGradient id="c4-jacket" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#142838"/>
                  <stop offset="20%"  stopColor="#1E3E54"/>
                  <stop offset="50%"  stopColor="#283E50"/>
                  <stop offset="80%"  stopColor="#1A3040"/>
                  <stop offset="100%" stopColor="#0E1E2C"/>
                </linearGradient>

                {/* Milk liquid */}
                <linearGradient id="c4-liquid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#FFFFFF"/>
                  <stop offset="30%"  stopColor="#F8F4E8"/>
                  <stop offset="100%" stopColor="#E8D8A8"/>
                </linearGradient>

                {/* Display screen */}
                <linearGradient id="c4-screen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#0A2444"/>
                  <stop offset="100%" stopColor="#061428"/>
                </linearGradient>

                {/* Support leg gradient */}
                <linearGradient id="c4-leg" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#1A2C3C"/>
                  <stop offset="40%"  stopColor="#2E4A60"/>
                  <stop offset="100%" stopColor="#142030"/>
                </linearGradient>
              </defs>

              <rect width="900" height="560" rx="24" fill="#071428"/>

              {/* Subtle pipe/circuit background lines */}
              {[80, 160, 240, 320, 400, 480].map((py) => (
                <line key={py} x1="40" y1={py} x2="360" y2={py}
                      stroke="#1A3A5A" strokeWidth="1" opacity="0.3"/>
              ))}

              {/* Support legs */}
              <rect x="308" y="454" width="18" height="78" rx="9" fill="url(#c4-leg)"/>
              <rect x="382" y="454" width="18" height="78" rx="9" fill="url(#c4-leg)"/>
              <rect x="524" y="454" width="18" height="78" rx="9" fill="url(#c4-leg)"/>
              <rect x="598" y="454" width="18" height="78" rx="9" fill="url(#c4-leg)"/>
              {/* Base feet */}
              <rect x="300" y="524" width="34" height="8" rx="4" fill="#243848"/>
              <rect x="374" y="524" width="34" height="8" rx="4" fill="#243848"/>
              <rect x="516" y="524" width="34" height="8" rx="4" fill="#243848"/>
              <rect x="590" y="524" width="34" height="8" rx="4" fill="#243848"/>

              {/* Insulation jacket (outer) */}
              <path
                d="M296 145 h332 v295 q0 50 -50 68 l-66 26 q-30 12 -66 0 l-66 -26 q-50 -18 -50 -68 Z"
                fill="url(#c4-jacket)" stroke="#2A4A68" strokeWidth="2"/>

              {/* Vessel shell (draws itself on scroll) */}
              <path
                className="evap-draw"
                d="M320 158 h268 v292 q0 44 -44 60 l-60 24 q-30 12 -60 0 l-60 -24 q-44 -16 -44 -60 Z"
                fill="url(#c4-vessel)"
                stroke="#5080A8" strokeWidth="2.5"
                pathLength={1} strokeDasharray="1" strokeDashoffset="1"/>

              {/* Vessel top highlight arc */}
              <path
                d="M322 158 h264" fill="none"
                stroke="#6898C0" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>

              {/* Liquid fill (GSAP: scaleY from 1 to 0.42) */}
              <g>
                <clipPath id="c4-clip">
                  <path d="M326 166 h256 v286 q0 40 -40 56 l-58 23 q-28 11 -60 0 l-58 -23 q-40 -16 -40 -56 Z"/>
                </clipPath>
                <rect className="evap-liquid" x="326" y="204"
                      width="256" height="272" fill="url(#c4-liquid)" clipPath="url(#c4-clip)"/>
                {/* Meniscus line */}
                <path d="M328 208 Q454 198 582 208"
                      fill="none" stroke="#E8F0F8" strokeWidth="2.5"
                      strokeLinecap="round" opacity="0.65"/>
              </g>

              {/* Rising vapour (CSS loop, gated by scroll) */}
              <g className="evap-vapor" opacity="0">
                {VAPOR.map((v, i) => (
                  <circle
                    key={i}
                    className="vapor"
                    cx={v.x}
                    cy="175"
                    r={6 + (i % 3) * 3}
                    fill="#B8D4E8"
                    opacity="0.6"
                    style={{ animationDelay: `${v.delay}s` }}
                  />
                ))}
              </g>

              {/* Top dome */}
              <ellipse cx="454" cy="158" rx="134" ry="24" fill="#3A6888" stroke="#5080A8" strokeWidth="2"/>
              <ellipse cx="454" cy="158" rx="120" ry="18" fill="#2A5070" opacity="0.8"/>

              {/* Inlet pipe (top) */}
              <rect x="438" y="110" width="32" height="50" rx="10"
                    fill="#2A5070" stroke="#4070A0" strokeWidth="1.5"/>
              <rect x="430" y="108" width="48" height="10" rx="5" fill="#4070A0"/>

              {/* Vacuum line */}
              <line x1="584" y1="190" x2="710" y2="190"
                    stroke="#2D659F" strokeWidth="3" strokeDasharray="8 7"/>
              <rect x="700" y="182" width="72" height="22" rx="11" fill="#0A2244"/>
              <text x="736" y="196" textAnchor="middle" fontSize="13"
                    fill="#7FA8D3" letterSpacing="1">VACUUM</text>

              {/* ── TOTAL SOLIDS READOUT ── */}
              <g>
                <rect x="634" y="268" width="200" height="134" rx="16"
                      fill="url(#c4-screen)" stroke="#2D659F" strokeWidth="2"/>
                <rect x="636" y="270" width="196" height="130" rx="15"
                      fill="none" stroke="#3D7AAF" strokeWidth="1" opacity="0.4"/>
                {/* Screen glow */}
                <rect x="640" y="274" width="188" height="24" rx="6" fill="#FFFFFF" opacity="0.03"/>
                <text x="734" y="298" textAnchor="middle" fontSize="12"
                      letterSpacing="2" fill="#6090C0">TOTAL SOLIDS</text>
                <text ref={solidsRef} x="734" y="368" textAnchor="middle"
                      fontSize="52" fontWeight="700" fill="#FFF5E0">12%</text>
                <text x="734" y="390" textAnchor="middle" fontSize="11"
                      fill="#5070A0" letterSpacing="1">CONCENTRATION</text>
              </g>

              {/* Concentrate outlet */}
              <g className="evap-out">
                <line x1="454" y1="462" x2="454" y2="516"
                      stroke="#C9A96A" strokeWidth="6" strokeLinecap="round"/>
                <path d="M440 508 l14 18 14 -18"
                      fill="none" stroke="#C9A96A" strokeWidth="6"
                      strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="396" y="498" width="38" height="22" rx="11" fill="#C9A96A"/>
                <text x="415" y="513" textAnchor="middle" fontSize="10"
                      fill="#0A1A28" letterSpacing="1" fontWeight="700">OUT</text>
                <text x="510" y="516" fontSize="12" fill="#C9A96A" letterSpacing="1.2">
                  CONCENTRATED BASE
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
