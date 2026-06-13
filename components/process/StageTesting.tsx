"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";
import StageCopy from "./StageCopy";

const TUBES = [
  { x: 148, fill: 0.72, color: "#F8FBFF", accent: "#B8D8F0" },
  { x: 230, fill: 0.55, color: "#FFFEF4", accent: "#E8E4A0" },
  { x: 312, fill: 0.85, color: "#F4FFFE", accent: "#A0E4DC" },
];

/**
 * Stage 2 — the laboratory. Equipment fades in, test tubes fill with
 * samples, analysis bars run, batch stamped PASSED.
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

      tl.fromTo(
        ".lab-item",
        { y: 26, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.16, stagger: 0.05, ease: "power2.out" },
        0.05
      );

      tl.fromTo(
        ".tube-fill",
        { scaleY: 0, transformOrigin: "center bottom" },
        { scaleY: 1, duration: 0.22, stagger: 0.07 },
        0.28
      );

      tl.fromTo(
        ".lab-bar",
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.24, stagger: 0.06 },
        0.42
      );

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
            <svg viewBox="0 0 900 560" className="w-full" role="img"
                 aria-label="Laboratory quality testing of milk samples with test tubes and analyser">
              <defs>
                {/* Grid pattern — double-line technical grid */}
                <pattern id="t2-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" fill="none" stroke="#1E4A80" strokeWidth="0.5" opacity="0.3"/>
                  <path d="M40 0H0V40" fill="none" stroke="#1A3A68" strokeWidth="0.15" opacity="0.15"
                        transform="translate(20,20)"/>
                </pattern>

                {/* Screen gradient */}
                <linearGradient id="t2-screen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#0C2848"/>
                  <stop offset="100%" stopColor="#061828"/>
                </linearGradient>

                {/* Stainless bench */}
                <linearGradient id="t2-bench" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#C8D8E4"/>
                  <stop offset="25%"  stopColor="#A8BCC8"/>
                  <stop offset="60%"  stopColor="#8098A8"/>
                  <stop offset="100%" stopColor="#607080"/>
                </linearGradient>

                {/* Glass tube */}
                <linearGradient id="t2-glass" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.5"/>
                  <stop offset="15%"  stopColor="#FFFFFF" stopOpacity="0.1"/>
                  <stop offset="70%"  stopColor="#6090B8" stopOpacity="0.1"/>
                  <stop offset="100%" stopColor="#204870" stopOpacity="0.3"/>
                </linearGradient>

                {/* Bar glow */}
                <filter id="t2-glow">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
                  <feComposite in="blur" in2="SourceGraphic" operator="over"/>
                </filter>
              </defs>

              {/* Background */}
              <rect width="900" height="560" rx="24" fill="#071428"/>
              <rect width="900" height="560" rx="24" fill="url(#t2-grid)"/>

              {/* Stainless lab bench */}
              <rect x="50" y="446" width="800" height="18" rx="9" fill="url(#t2-bench)"
                    stroke="#4A6070" strokeWidth="1"/>
              <rect x="50" y="446" width="800" height="5" rx="2" fill="#FFFFFF" opacity="0.18"/>

              {/* ── TEST TUBE RACK ── */}
              <g className="lab-item">
                {/* Rack base */}
                <rect x="112" y="428" width="264" height="20" rx="10" fill="#123A66" stroke="#2D5A88" strokeWidth="1.5"/>
                {/* Rack highlight */}
                <rect x="116" y="430" width="256" height="5" rx="2" fill="#FFFFFF" opacity="0.12"/>

                {TUBES.map((tube, i) => (
                  <g key={i}>
                    {/* Tube shadow */}
                    <ellipse cx={tube.x + 20} cy={436} rx="14" ry="5" fill="#000A1E" opacity="0.35"/>

                    {/* Liquid fill (GSAP target: scaleY from 0) */}
                    <rect className="tube-fill"
                          x={tube.x + 6} y={296 + (1 - tube.fill) * 132}
                          width="28" height={tube.fill * 132} rx="10"
                          fill={tube.color}/>
                    {/* Meniscus curve */}
                    <path className="tube-fill"
                          d={`M${tube.x + 6} ${296 + (1 - tube.fill) * 132} Q${tube.x + 20} ${296 + (1 - tube.fill) * 132 - 8} ${tube.x + 34} ${296 + (1 - tube.fill) * 132}`}
                          fill={tube.accent} opacity="0.6"/>
                    {/* Liquid highlight */}
                    <rect x={tube.x + 7} y={296 + (1 - tube.fill) * 132 + 4}
                          width="8" height={tube.fill * 60} rx="4"
                          fill="#FFFFFF" opacity="0.25"/>

                    {/* Glass outer shell */}
                    <path d={`M${tube.x} 248 v180 a20 20 0 0 0 40 0 v-180`}
                          fill="url(#t2-glass)" stroke="#5888A8" strokeWidth="2.5"/>
                    {/* Glass top rim */}
                    <line x1={tube.x - 6} y1="248" x2={tube.x + 46} y2="248"
                          stroke="#5888A8" strokeWidth="2.5"/>
                    {/* Left glass edge highlight */}
                    <path d={`M${tube.x + 2} 250 v170`}
                          stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                    {/* Graduation marks */}
                    {[280, 310, 340, 370, 400].map((gy) => (
                      <line key={gy} x1={tube.x + 36} y1={gy} x2={tube.x + 46} y2={gy}
                            stroke="#5888A8" strokeWidth="1" opacity="0.5"/>
                    ))}
                  </g>
                ))}
              </g>

              {/* ── MICROSCOPE ── */}
              <g className="lab-item">
                {/* Base */}
                <ellipse cx="510" cy="454" rx="68" ry="12" fill="#0E304A" stroke="#2A5070" strokeWidth="1.5"/>
                {/* Stage */}
                <rect x="476" y="420" width="68" height="8" rx="4" fill="#7095A8" stroke="#4A7090" strokeWidth="1"/>
                <rect x="483" y="418" width="54" height="4" rx="2" fill="#90B0C0"/>
                {/* Arm */}
                <path d="M510 420 q-8 -72 30 -110 l12 14 q-24 30 -18 96 Z" fill="#7095A8" stroke="#4A7090" strokeWidth="1"/>
                {/* Body tube */}
                <rect x="527" y="290" width="24" height="52" rx="8"
                      fill="#5A8098" stroke="#4A7090" strokeWidth="1.5"
                      transform="rotate(-34 539 316)"/>
                {/* Eyepiece */}
                <rect x="538" y="268" width="20" height="36" rx="8"
                      fill="#486880" stroke="#3A6080" strokeWidth="1.5"
                      transform="rotate(-34 548 286)"/>
                <circle cx="556" cy="258" r="8" fill="#3A5878"/>
                {/* Objective lens assembly */}
                {[0, 1, 2].map((li) => (
                  <circle key={li} cx={476 + li * 8} cy={320 - li * 4} r={4 + li}
                          fill="#2A4868" stroke="#3A6080" strokeWidth="1"/>
                ))}
                {/* Coarse focus knob */}
                <rect x="532" y="360" width="16" height="24" rx="8" fill="#3A6080"/>
                <rect x="533" y="362" width="5" height="20" rx="2" fill="#4A7090" opacity="0.6"/>
              </g>

              {/* ── DIGITAL ANALYSER ── */}
              <g className="lab-item">
                {/* Screen casing */}
                <rect x="604" y="232" width="232" height="216" rx="16"
                      fill="url(#t2-screen)" stroke="#2D5A88" strokeWidth="2"/>
                {/* Screen edge glow */}
                <rect x="604" y="232" width="232" height="216" rx="16"
                      fill="none" stroke="#4A80B8" strokeWidth="1" opacity="0.4"/>
                {/* Screen top reflection */}
                <rect x="612" y="238" width="216" height="24" rx="8" fill="#FFFFFF" opacity="0.04"/>

                {/* Title bar */}
                <rect x="616" y="248" width="208" height="28" rx="6" fill="#0A2244" opacity="0.8"/>
                <text x="720" y="266" textAnchor="middle" fontSize="13"
                      letterSpacing="2" fill="#7FA8D3">BATCH ANALYSIS</text>

                {/* Analysis bars */}
                {[
                  { y: 296, label: "PROTEIN", w: 148, val: "3.42%" },
                  { y: 340, label: "FAT",     w:  92, val: "1.05%" },
                  { y: 384, label: "MICROBIO",w: 164, val: "< 5 CFU" },
                ].map((row) => (
                  <g key={row.label}>
                    <text x="620" y={row.y + 8} fontSize="11" fill="#6090C0" letterSpacing="1.5">
                      {row.label}
                    </text>
                    <text x="820" y={row.y + 8} textAnchor="end" fontSize="11" fill="#9ABCE0">
                      {row.val}
                    </text>
                    {/* Track */}
                    <rect x="620" y={row.y + 14} width="196" height="9" rx="4" fill="#0C2040"/>
                    {/* Fill bar (GSAP target) */}
                    <rect className="lab-bar" x="620" y={row.y + 14}
                          width={row.w} height="9" rx="4" fill="#C9A96A"
                          filter="url(#t2-glow)"/>
                    {/* Bar glow overlay */}
                    <rect className="lab-bar" x="620" y={row.y + 14}
                          width={row.w} height="4" rx="2" fill="#F0D080" opacity="0.4"/>
                  </g>
                ))}

                {/* Standard footer */}
                <rect x="612" y="420" width="212" height="20" rx="4" fill="#0A1E38"/>
                <text x="718" y="432" textAnchor="middle" fontSize="10" fill="#5880A8" letterSpacing="1.2">
                  STB 1. EAC 033. ISO 707
                </text>
              </g>

              {/* ── PASSED STAMP ── */}
              <g className="lab-pass" transform="rotate(-14 718 178)">
                <circle cx="718" cy="178" r="48" fill="none" stroke="#C9A96A" strokeWidth="3.5"/>
                <circle cx="718" cy="178" r="40" fill="none" stroke="#C9A96A" strokeWidth="1" opacity="0.55"/>
                <circle cx="718" cy="178" r="32" fill="#0A1E2C" opacity="0.85"/>
                {/* Tick mark */}
                <path d="M702 178 l12 13 26 -27" fill="none"
                      stroke="#C9A96A" strokeWidth="6"
                      strokeLinecap="round" strokeLinejoin="round"/>
                <text x="718" y="156" textAnchor="middle" fontSize="10"
                      letterSpacing="2.5" fill="#C9A96A">QUALITY</text>
                <text x="718" y="202" textAnchor="middle" fontSize="10"
                      letterSpacing="2.5" fill="#C9A96A">APPROVED</text>
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
