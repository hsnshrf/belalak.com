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
  const ref     = useRef<HTMLElement>(null);
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

      tl.fromTo(".pipe-draw", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.34 }, 0.04);

      tl.fromTo(".past-flow", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.4);

      tl.fromTo(
        ".gauge-needle",
        { rotation: -116, svgOrigin: "672 210" },
        { rotation: 64, duration: 0.34, ease: "power1.inOut" },
        0.42
      );

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
            <svg viewBox="0 0 900 560" className="w-full" role="img"
                 aria-label="Milk flowing through stainless steel pasteurization heat exchanger">
              <defs>
                {/* Stainless steel — cylindrical cross-section (top-lit) */}
                <linearGradient id="p3-steel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#F4F8FC"/>
                  <stop offset="12%"  stopColor="#E2EEF6"/>
                  <stop offset="28%"  stopColor="#C0D4E4"/>
                  <stop offset="50%"  stopColor="#9BBAD0"/>
                  <stop offset="72%"  stopColor="#7098B4"/>
                  <stop offset="88%"  stopColor="#507890"/>
                  <stop offset="100%" stopColor="#3A5C72"/>
                </linearGradient>

                {/* Heat glow — amber/orange radial */}
                <radialGradient id="p3-heat" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#F29040" stopOpacity="0.65"/>
                  <stop offset="55%"  stopColor="#E07020" stopOpacity="0.28"/>
                  <stop offset="100%" stopColor="#C05000" stopOpacity="0"/>
                </radialGradient>

                {/* Gauge background arc (colour temperature zones) */}
                <radialGradient id="p3-gaugebg" cx="50%" cy="80%" r="70%">
                  <stop offset="0%"   stopColor="#FAFAFA"/>
                  <stop offset="100%" stopColor="#E8EEF4"/>
                </radialGradient>

                {/* Gauge bezel */}
                <radialGradient id="p3-bezel" cx="45%" cy="35%" r="70%">
                  <stop offset="0%"   stopColor="#D0DDE8"/>
                  <stop offset="55%"  stopColor="#A0B4C4"/>
                  <stop offset="100%" stopColor="#607888"/>
                </radialGradient>

                {/* Condensation drop */}
                <radialGradient id="p3-drop" cx="30%" cy="25%" r="65%">
                  <stop offset="0%"   stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#A8C8DC"/>
                </radialGradient>

                {/* Panel background */}
                <linearGradient id="p3-panel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#FAFCFE"/>
                  <stop offset="100%" stopColor="#EEF2F6"/>
                </linearGradient>
              </defs>

              {/* Panel background */}
              <rect width="900" height="560" rx="24" fill="url(#p3-panel)"/>
              {/* Subtle panel lines */}
              {[280, 400].map((py) => (
                <line key={py} x1="40" y1={py} x2="860" y2={py}
                      stroke="#D4DDE8" strokeWidth="1" opacity="0.6"/>
              ))}

              {/* ── SERPENTINE PIPE (steel casing) ── */}
              <path
                d="M60 120 H600 Q660 120 660 180 V300 Q660 360 600 360 H300 Q240 360 240 420 V440 Q240 470 270 470 H840"
                fill="none" stroke="url(#p3-steel)" strokeWidth="36" strokeLinecap="round"/>
              {/* Pipe shadow underline */}
              <path
                d="M60 120 H600 Q660 120 660 180 V300 Q660 360 600 360 H300 Q240 360 240 420 V440 Q240 470 270 470 H840"
                fill="none" stroke="#3A5060" strokeWidth="36" strokeLinecap="round" opacity="0.12"
                transform="translate(0 4)"/>
              {/* Pipe top highlight (self-drawing centre line) */}
              <path
                className="pipe-draw"
                d="M60 120 H600 Q660 120 660 180 V300 Q660 360 600 360 H300 Q240 360 240 420 V440 Q240 470 270 470 H840"
                fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round"
                pathLength={1} strokeDasharray="1" strokeDashoffset="1" opacity="0.45"/>
              {/* Flowing milk (GSAP target) */}
              <path
                className="flow-dash past-flow"
                d="M60 120 H600 Q660 120 660 180 V300 Q660 360 600 360 H300 Q240 360 240 420 V440 Q240 470 270 470 H840"
                fill="none" stroke="#0A2E52" strokeWidth="7" strokeLinecap="round" opacity="0"/>

              {/* Pipe flanges at joints */}
              {[
                { x: 300, y: 120 }, { x: 600, y: 120 },
                { x: 660, y: 240 }, { x: 300, y: 360 },
                { x: 240, y: 430 }, { x: 600, y: 360 },
              ].map((f, i) => (
                <g key={i}>
                  <circle cx={f.x} cy={f.y} r="22" fill="#A8BCC8" stroke="#6888A0" strokeWidth="1.5"/>
                  <circle cx={f.x} cy={f.y} r="16" fill="#B8CCd8"/>
                  {/* Flange bolts */}
                  {[0, 90, 180, 270].map((ba) => {
                    const bx = f.x + Math.cos(ba * Math.PI / 180) * 17;
                    const by = f.y + Math.sin(ba * Math.PI / 180) * 17;
                    return <circle key={ba} cx={bx} cy={by} r="3" fill="#607888"/>;
                  })}
                </g>
              ))}

              {/* ── HEAT EXCHANGER BLOCK ── */}
              <g>
                {/* Heat glow */}
                <circle className="heat-glow" cx="450" cy="240" r="138"
                        fill="url(#p3-heat)" opacity="0"/>
                {/* Casing */}
                <rect x="374" y="174" width="152" height="132" rx="16"
                      fill="url(#p3-steel)" stroke="#5A7888" strokeWidth="2"/>
                {/* Casing highlight */}
                <rect x="378" y="176" width="144" height="18" rx="8" fill="#FFFFFF" opacity="0.22"/>
                {/* Corrugated fins */}
                {[196, 212, 228, 244, 260, 276].map((fy) => (
                  <g key={fy}>
                    <line x1="390" y1={fy + 8} x2="510" y2={fy + 8}
                          stroke="#D0E0EC" strokeWidth="6" strokeLinecap="round" opacity="0.75"/>
                    <line x1="390" y1={fy + 8} x2="510" y2={fy + 8}
                          stroke="#F4F8FC" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                  </g>
                ))}
                {/* Label */}
                <text x="450" y="326" textAnchor="middle" fontSize="13"
                      letterSpacing="2" fill="#123A66">HTST EXCHANGER</text>
              </g>

              {/* Condensation drops on cold pipe section */}
              {[
                { cx: 120, cy: 108 }, { cx: 220, cy: 114 }, { cx: 420, cy: 350 },
                { cx: 520, cy: 356 }, { cx: 280, cy: 450 },
              ].map((d, i) => (
                <ellipse key={i} cx={d.cx} cy={d.cy + 22} rx="4" ry="6"
                         fill="url(#p3-drop)" opacity="0.5"/>
              ))}

              {/* ── TEMPERATURE GAUGE ── */}
              <g>
                {/* Bezel */}
                <circle cx="672" cy="210" r="80" fill="url(#p3-bezel)"/>
                <circle cx="672" cy="210" r="74" fill="url(#p3-gaugebg)"/>
                {/* Glass cover effect */}
                <ellipse cx="656" cy="188" rx="32" ry="20" fill="#FFFFFF" opacity="0.1"/>

                {/* Coloured arc: blue (cold) → orange (pasteurize) */}
                {Array.from({ length: 11 }).map((_, i) => {
                  const startAngle = (-210 + i * 24) * (Math.PI / 180);
                  const endAngle   = (-210 + (i + 1) * 24) * (Math.PI / 180);
                  const r = 60;
                  const x1s = (672 + Math.cos(startAngle) * r).toFixed(2);
                  const y1s = (210 + Math.sin(startAngle) * r).toFixed(2);
                  const x2e = (672 + Math.cos(endAngle) * r).toFixed(2);
                  const y2e = (210 + Math.sin(endAngle) * r).toFixed(2);
                  const color = i < 4 ? "#4A80C0" : i < 7 ? "#E0A020" : "#E05020";
                  return (
                    <path key={i}
                      d={`M ${x1s} ${y1s} A ${r} ${r} 0 0 1 ${x2e} ${y2e}`}
                      fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" opacity="0.55"/>
                  );
                })}

                {/* Tick marks */}
                {Array.from({ length: 11 }).map((_, i) => {
                  const angle = (-210 + i * 24) * (Math.PI / 180);
                  const x1 = (672 + Math.cos(angle) * 58).toFixed(2);
                  const y1 = (210 + Math.sin(angle) * 58).toFixed(2);
                  const x2 = (672 + Math.cos(angle) * (i % 5 === 0 ? 44 : 50)).toFixed(2);
                  const y2 = (210 + Math.sin(angle) * (i % 5 === 0 ? 44 : 50)).toFixed(2);
                  return (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="#123A66" strokeWidth={i % 5 === 0 ? 3 : 1.5}/>
                  );
                })}

                {/* Needle (GSAP target) */}
                <line className="gauge-needle"
                      x1="672" y1="210" x2="672" y2="158"
                      stroke="#C9A96A" strokeWidth="5" strokeLinecap="round"/>
                <circle cx="672" cy="210" r="9" fill="#0A2E52"/>
                <circle cx="672" cy="210" r="5" fill="#C9A96A"/>

                {/* Digital readout */}
                <rect x="628" y="242" width="88" height="28" rx="8" fill="#0A1E30"/>
                <text ref={tempRef} x="672" y="261" textAnchor="middle"
                      fontSize="18" fontWeight="700" fill="#F0D888">4.0°C</text>
              </g>

              {/* ── HOLD-TIME LABEL ── */}
              <g className="hold-label">
                <rect x="592" y="390" width="196" height="42" rx="21" fill="#0A2E52"/>
                <rect x="594" y="392" width="192" height="38" rx="19" fill="none"
                      stroke="#2A5878" strokeWidth="1"/>
                <text x="690" y="416" textAnchor="middle" fontSize="15"
                      letterSpacing="1.5" fill="#FFF7E8">72.5°C · 15 SEC</text>
              </g>

              {/* Valves */}
              {[140, 760].map((vx) => (
                <g key={vx}>
                  <circle cx={vx} cy="470" r="18" fill="#B0C4D0" stroke="#7090A8" strokeWidth="2"/>
                  <circle cx={vx} cy="470" r="12" fill="#A0B4C4"/>
                  <line x1={vx - 9} y1="470" x2={vx + 9} y2="470"
                        stroke="#0A2E52" strokeWidth="4.5" strokeLinecap="round"/>
                  {/* Valve handle */}
                  <line x1={vx} y1="452" x2={vx} y2="442"
                        stroke="#607888" strokeWidth="4" strokeLinecap="round"/>
                  <line x1={vx - 6} y1="440" x2={vx + 6} y2="440"
                        stroke="#607888" strokeWidth="4" strokeLinecap="round"/>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
