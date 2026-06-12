"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";
import StageCopy from "./StageCopy";

/**
 * Stage 3 — pasteurization. Stainless lines draw themselves on scroll,
 * milk flows through the heat exchanger, the gauge needle sweeps and the
 * digital readout climbs to 72.5°C.
 */
export default function StagePasteurization() {
  const ref = useRef<HTMLElement>(null);
  const tempRef = useRef<SVGTextElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const section = ref.current;
    if (!section) return;

    if (reduced) {
      if (tempRef.current) tempRef.current.textContent = "72.5°C";
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

      // The processing line draws itself (pathLength=1 trick keeps the
      // dash math resolution-independent).
      tl.fromTo(".pipe-draw", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.34 }, 0.04);

      // Milk flow appears once the line is complete.
      tl.fromTo(".past-flow", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.4);

      // Gauge needle sweeps from cold to pasteurization temperature.
      tl.fromTo(
        ".gauge-needle",
        { rotation: -116, svgOrigin: "672 210" },
        { rotation: 64, duration: 0.34, ease: "power1.inOut" },
        0.42
      );

      // Temperature readout counts up in lockstep with the needle.
      const temp = { value: 4 };
      tl.to(
        temp,
        {
          value: 72.5,
          duration: 0.34,
          ease: "power1.inOut",
          onUpdate: () => {
            if (tempRef.current) tempRef.current.textContent = `${temp.value.toFixed(1)}°C`;
          },
        },
        0.42
      );

      // Heat-exchanger glow breathes once the target is reached.
      tl.fromTo(".heat-glow", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.5);
      tl.fromTo(".hold-label", { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.1 }, 0.8);
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={ref} className={`relative bg-gradient-to-b from-milk to-deep-50 ${reduced ? "" : "h-[180vh]"}`}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="container-site grid w-full items-center gap-10 py-20 lg:grid-cols-2 lg:gap-16">
          <StageCopy
            index={3}
            kicker="Pasteurization"
            title="Gentle heat. Uncompromised nutrition."
            text="The milk is gently pasteurized to ensure safety while preserving nutritional value."
            tone="light"
          />

          <div className="relative">
            <svg viewBox="0 0 900 560" className="w-full" role="img" aria-label="Milk flowing through stainless steel pasteurization lines">
              <defs>
                <linearGradient id="p3-steel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#E6EDF3" />
                  <stop offset="0.5" stopColor="#AEBDCB" />
                  <stop offset="1" stopColor="#6E7E8F" />
                </linearGradient>
                <radialGradient id="p3-heat" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#F2A65A" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#F2A65A" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="900" height="560" rx="24" fill="#FAFAFA" />

              {/* serpentine processing line — steel casing then drawn highlight */}
              <path
                d="M60 120 H600 Q660 120 660 180 V300 Q660 360 600 360 H300 Q240 360 240 420 V440 Q240 470 270 470 H840"
                fill="none"
                stroke="url(#p3-steel)"
                strokeWidth="34"
                strokeLinecap="round"
              />
              <path
                className="pipe-draw"
                d="M60 120 H600 Q660 120 660 180 V300 Q660 360 600 360 H300 Q240 360 240 420 V440 Q240 470 270 470 H840"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="12"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset="1"
              />
              {/* flowing milk */}
              <path
                className="flow-dash past-flow"
                d="M60 120 H600 Q660 120 660 180 V300 Q660 360 600 360 H300 Q240 360 240 420 V440 Q240 470 270 470 H840"
                fill="none"
                stroke="#0A2E52"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0"
              />

              {/* heat exchanger block */}
              <g>
                <circle className="heat-glow" cx="450" cy="240" r="130" fill="url(#p3-heat)" opacity="0" />
                <rect x="380" y="180" width="140" height="120" rx="14" fill="url(#p3-steel)" stroke="#6E7E8F" strokeWidth="2" />
                {[200, 222, 244, 266].map((y) => (
                  <line key={y} x1="396" y1={y + 8} x2="504" y2={y + 8} stroke="#FAFAFA" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
                ))}
                <text x="450" y="324" textAnchor="middle" fontSize="14" letterSpacing="2" fill="#123A66">
                  HTST EXCHANGER
                </text>
              </g>

              {/* temperature gauge */}
              <g>
                <circle cx="672" cy="210" r="72" fill="#FFFFFF" stroke="#AEBDCB" strokeWidth="4" />
                {Array.from({ length: 11 }).map((_, i) => {
                  const angle = (-210 + i * 24) * (Math.PI / 180);
                  // Round trig results: Math.cos/sin can differ by 1 ULP
                  // between Node and browser, breaking hydration.
                  const x1 = (672 + Math.cos(angle) * 58).toFixed(2);
                  const y1 = (210 + Math.sin(angle) * 58).toFixed(2);
                  const x2 = (672 + Math.cos(angle) * 48).toFixed(2);
                  const y2 = (210 + Math.sin(angle) * 48).toFixed(2);
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#123A66" strokeWidth={i % 5 === 0 ? 3 : 1.5} />;
                })}
                <line className="gauge-needle" x1="672" y1="210" x2="672" y2="156" stroke="#C9A96A" strokeWidth="5" strokeLinecap="round" />
                <circle cx="672" cy="210" r="8" fill="#0A2E52" />
                <text ref={tempRef} x="672" y="252" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0A2E52">
                  4.0°C
                </text>
              </g>

              {/* hold-time label */}
              <g className="hold-label">
                <rect x="600" y="396" width="180" height="40" rx="20" fill="#0A2E52" />
                <text x="690" y="421" textAnchor="middle" fontSize="15" letterSpacing="1.5" fill="#FFF7E8">
                  72.5°C · 15 SEC
                </text>
              </g>

              {/* valves */}
              {[140, 760].map((x) => (
                <g key={x}>
                  <circle cx={x} cy="470" r="16" fill="#AEBDCB" stroke="#6E7E8F" strokeWidth="2" />
                  <line x1={x - 8} y1="470" x2={x + 8} y2="470" stroke="#123A66" strokeWidth="4" strokeLinecap="round" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
