"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";
import StageCopy from "./StageCopy";

const DOTS = 56;
const BAG = { x: 340, y: 170, w: 220, h: 290 };

/** Point on the bag's rectangular outline for parameter t ∈ [0,1). */
function perimeterPoint(t: number) {
  const { x, y, w, h } = BAG;
  const total = 2 * (w + h);
  let d = t * total;
  if (d < w) return { x: x + d, y };
  d -= w;
  if (d < h) return { x: x + w, y: y + d };
  d -= h;
  if (d < w) return { x: x + w - d, y: y + h };
  d -= w;
  return { x, y: y + h - d };
}

// Deterministic scattered start positions (golden-angle spiral) and
// their targets on the package outline. Trig results are rounded to two
// decimals because Math.cos/sin can differ by 1 ULP between the Node
// server and the browser, which would break hydration.
const round2 = (n: number) => Math.round(n * 100) / 100;

const dots = Array.from({ length: DOTS }, (_, i) => {
  const angle = i * 2.39996;
  const radius = 150 + ((i * 73) % 150);
  return {
    sx: round2(Math.min(880, Math.max(20, 450 + Math.cos(angle) * radius * 1.5))),
    sy: round2(Math.min(540, Math.max(20, 315 + Math.sin(angle) * radius * 0.85))),
    target: perimeterPoint(i / DOTS),
    r: 2.6 + ((i * 37) % 10) / 4,
  };
});

/**
 * Stage 6 — the reveal. Loose powder particles drift in from across the
 * frame, assemble into the silhouette of a Belalak bag, and the finished
 * package materialises with a sheen and a "Made in Belarus" stamp.
 */
export default function StageFinalProduct() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const section = ref.current;
    if (!section) return;

    if (reduced) {
      gsap.set(section.querySelectorAll(".pack-dot"), { autoAlpha: 0 });
      gsap.set(section.querySelectorAll(".pack-bag, .pack-badge"), { autoAlpha: 1 });
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

      tl.fromTo(".stage-copy", { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.16, ease: "power2.out" }, 0.02);

      // Powder gathers: every particle flies to its slot on the outline.
      tl.to(
        ".pack-dot",
        {
          attr: { cx: (i: number) => dots[i].target.x, cy: (i: number) => dots[i].target.y },
          duration: 0.42,
          stagger: 0.003,
          ease: "power2.inOut",
        },
        0.06
      );

      // The package fades up through the particle outline…
      tl.fromTo(".pack-bag", { autoAlpha: 0, scale: 0.94, svgOrigin: "450 315" }, { autoAlpha: 1, scale: 1, duration: 0.16 }, 0.56);
      // …and the particles dissolve into it.
      tl.to(".pack-dot", { autoAlpha: 0, duration: 0.1 }, 0.6);

      // Sheen sweep across the front face.
      tl.fromTo(".pack-shine", { x: -260 }, { x: 280, duration: 0.12, ease: "power1.inOut" }, 0.74);

      // Origin stamp.
      tl.fromTo(
        ".pack-badge",
        { scale: 2, autoAlpha: 0, svgOrigin: "583 207" },
        { scale: 1, autoAlpha: 1, duration: 0.08, ease: "power3.in" },
        0.86
      );
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={ref} className={`relative bg-gradient-to-b from-cream to-milk ${reduced ? "" : "h-[220vh]"}`}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="container-site grid w-full items-center gap-10 py-20 lg:grid-cols-2 lg:gap-16">
          <StageCopy
            index={6}
            kicker="Final Product"
            title="Consistent quality. Long shelf life. Exceptional performance."
            text="Milk powder particles come together into the finished product — sealed, certified and ready to perform in your formulation."
            tone="light"
          />

          <div className="relative">
            <svg viewBox="0 0 900 560" className="w-full" role="img" aria-label="Powder particles forming a finished Belalak milk powder package">
              <defs>
                {/* Pearlescent foil bag — slight silver-blue sheen */}
                <linearGradient id="f6-bag" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="#FAFCFE"/>
                  <stop offset="22%"  stopColor="#F2F6FC"/>
                  <stop offset="45%"  stopColor="#FAFAFA"/>
                  <stop offset="68%"  stopColor="#F4F0E8"/>
                  <stop offset="100%" stopColor="#EAE0D0"/>
                </linearGradient>
                {/* Left-edge shadow on bag (3D fold) */}
                <linearGradient id="f6-bag-l" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#B8C8D8" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#B8C8D8" stopOpacity="0"/>
                </linearGradient>
                {/* Right-edge shadow */}
                <linearGradient id="f6-bag-r" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%"   stopColor="#A0B0C0" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#A0B0C0" stopOpacity="0"/>
                </linearGradient>
                {/* Sheen sweep */}
                <linearGradient id="f6-shine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0"/>
                  <stop offset="45%"  stopColor="#FFFFFF" stopOpacity="0.7"/>
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
                </linearGradient>
                {/* Top header band */}
                <linearGradient id="f6-header" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#061828"/>
                  <stop offset="30%"  stopColor="#0A2E52"/>
                  <stop offset="70%"  stopColor="#0A2E52"/>
                  <stop offset="100%" stopColor="#061828"/>
                </linearGradient>
                {/* Label area */}
                <linearGradient id="f6-label" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#F8F4EC"/>
                </linearGradient>
                <clipPath id="f6-clip">
                  <rect x={BAG.x} y={BAG.y} width={BAG.w} height={BAG.h} rx="18"/>
                </clipPath>
                <clipPath id="f6-label-clip">
                  <rect x={BAG.x + 16} y={BAG.y + 60} width={BAG.w - 32} height="220" rx="6"/>
                </clipPath>
              </defs>

              <rect width="900" height="560" rx="24" fill="#FFF7E8"/>
              <circle cx="450" cy="315" r="218" fill="#FFFFFF" opacity="0.55"/>
              {/* Subtle radial glow behind bag */}
              <radialGradient id="f6-bglow" cx="50%" cy="56%" r="35%">
                <stop offset="0%"   stopColor="#DDE8F0" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#DDE8F0" stopOpacity="0"/>
              </radialGradient>
              <rect width="900" height="560" fill="url(#f6-bglow)"/>

              {/* drifting powder particles (scrub-converged) */}
              {dots.map((dot, i) => (
                <circle key={i} className="pack-dot" cx={dot.sx} cy={dot.sy} r={dot.r} fill="#C9A96A" opacity="0.8"/>
              ))}

              {/* ═══════ FINISHED PACKAGE ═══════ */}
              <g className="pack-bag" opacity="0">
                {/* Drop shadow */}
                <ellipse cx="450" cy="476" rx="138" ry="18" fill="#0A1E30" opacity="0.14"/>
                <ellipse cx="450" cy="480" rx="100" ry="10" fill="#0A1E30" opacity="0.08"/>

                {/* Bottom gusset (trapezoid fold) */}
                <path d={`M${BAG.x + 18} ${BAG.y + BAG.h - 6} L${BAG.x + BAG.w - 18} ${BAG.y + BAG.h - 6} L${BAG.x + BAG.w - 6} ${BAG.y + BAG.h + 14} L${BAG.x + 6} ${BAG.y + BAG.h + 14} Z`}
                      fill="#D8CCB8" stroke="#C4B8A0" strokeWidth="1"/>

                {/* Main bag body */}
                <rect x={BAG.x} y={BAG.y} width={BAG.w} height={BAG.h} rx="18"
                      fill="url(#f6-bag)" stroke="#C8D0D8" strokeWidth="1.5"/>

                {/* Left edge fold shadow */}
                <rect x={BAG.x} y={BAG.y} width="28" height={BAG.h} rx="18"
                      fill="url(#f6-bag-l)" clipPath="url(#f6-clip)"/>
                {/* Right edge fold shadow */}
                <rect x={BAG.x + BAG.w - 28} y={BAG.y} width="28" height={BAG.h} rx="18"
                      fill="url(#f6-bag-r)" clipPath="url(#f6-clip)"/>

                {/* Subtle fold lines (bag structure) */}
                <line x1={BAG.x + 20} y1={BAG.y + 30} x2={BAG.x + 14} y2={BAG.y + BAG.h - 20}
                      stroke="#B8C4CC" strokeWidth="1" opacity="0.4"/>
                <line x1={BAG.x + BAG.w - 20} y1={BAG.y + 30} x2={BAG.x + BAG.w - 14} y2={BAG.y + BAG.h - 20}
                      stroke="#B8C4CC" strokeWidth="1" opacity="0.4"/>

                {/* ── TOP CRIMP SEAL BAND ── */}
                <rect x={BAG.x - 10} y={BAG.y - 6} width={BAG.w + 20} height="32" rx="10"
                      fill="url(#f6-header)"/>
                {/* Header highlight */}
                <rect x={BAG.x - 8} y={BAG.y - 4} width={BAG.w + 16} height="10" rx="6"
                      fill="#FFFFFF" opacity="0.08"/>
                {/* Crimp texture lines */}
                {[0, 1, 2, 3, 4].map((li) => (
                  <line key={li}
                    x1={BAG.x} y1={BAG.y + 4 + li * 5}
                    x2={BAG.x + BAG.w} y2={BAG.y + 4 + li * 5}
                    stroke="#FFF7E8" strokeWidth="0.8" strokeDasharray="3 6" opacity="0.2"/>
                ))}

                {/* ── PRODUCT LABEL AREA ── */}
                <rect x={BAG.x + 16} y={BAG.y + 58} width={BAG.w - 32} height="224" rx="8"
                      fill="url(#f6-label)" stroke="#E0D4C0" strokeWidth="1"
                      clipPath="url(#f6-label-clip)"/>

                {/* ── LABEL CONTENT ── */}
                <g textAnchor="middle">
                  {/* Milk drop icon */}
                  <path d="M450 236 c7 10.5 13 17.4 13 24.5 a13 13 0 1 1 -26 0 c0 -7.1 6 -14 13 -24.5z"
                        fill="#0A2E52"/>

                  {/* Gold accent line */}
                  <rect x="388" y="274" width="124" height="2" rx="1" fill="#C9A96A"/>

                  {/* Brand name */}
                  <text x="450" y="302" fontFamily="Calibri, Carlito, sans-serif"
                        fontSize="28" letterSpacing="7" fill="#0A2E52" fontWeight="700">BELALAK</text>

                  {/* Gold divider */}
                  <line x1="390" y1="316" x2="510" y2="316" stroke="#C9A96A" strokeWidth="1.5"/>

                  {/* Product type */}
                  <text x="450" y="338" fontSize="13" letterSpacing="3.5" fill="#123A66">PREMIUM</text>
                  <text x="450" y="358" fontSize="13" letterSpacing="3.5" fill="#123A66">MILK POWDER</text>

                  {/* Net weight */}
                  <rect x="408" y="372" width="84" height="20" rx="10" fill="#F0E8D8"/>
                  <text x="450" y="385" fontSize="11" letterSpacing="1.5" fill="#6A5A40">NET WT. 25 KG</text>

                  {/* Barcode area */}
                  <rect x="414" y="412" width="72" height="28" rx="2" fill="#FFFFFF" stroke="#D0C8B8" strokeWidth="1"/>
                  {[416, 419, 422, 426, 430, 434, 437, 440, 443, 447, 451, 455, 458, 461, 464, 468, 472, 476, 479, 482].map((bx, i) => (
                    <rect key={bx} x={bx} y="414" width={i % 3 === 0 ? 2 : 1} height="22"
                          fill="#0A0A0A" rx="0.5"/>
                  ))}
                </g>

                {/* Sheen sweep, clipped to bag */}
                <g clipPath="url(#f6-clip)">
                  <rect className="pack-shine"
                        x={BAG.x - 48} y={BAG.y - 24}
                        width="96" height={BAG.h + 48}
                        fill="url(#f6-shine)" transform="skewX(-13)"/>
                </g>
              </g>

              {/* ═══════ MADE IN BELARUS STAMP ═══════ */}
              <g className="pack-badge" opacity="0">
                {/* Outer stamp ring */}
                <circle cx="583" cy="207" r="48" fill="#0A2E52"/>
                <circle cx="583" cy="207" r="44" fill="none" stroke="#C9A96A" strokeWidth="2"/>
                <circle cx="583" cy="207" r="38" fill="none" stroke="#C9A96A" strokeWidth="0.8" opacity="0.5"/>
                {/* Inner content */}
                <circle cx="583" cy="207" r="33" fill="#082040" opacity="0.8"/>
                <text x="583" y="197" textAnchor="middle" fontSize="10"
                      letterSpacing="2" fill="#FFF7E8">MADE IN</text>
                <text x="583" y="212" textAnchor="middle" fontSize="12"
                      letterSpacing="2" fill="#C9A96A" fontWeight="700">BELARUS</text>
                <text x="583" y="226" textAnchor="middle" fontSize="9"
                      fill="#FFF7E8" opacity="0.65">★ ★ ★</text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
