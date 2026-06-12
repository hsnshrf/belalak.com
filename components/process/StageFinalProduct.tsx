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
                <linearGradient id="f6-bag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFFFFF" />
                  <stop offset="0.55" stopColor="#FAFAFA" />
                  <stop offset="1" stopColor="#EDE4D2" />
                </linearGradient>
                <linearGradient id="f6-shine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.65" />
                  <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
                <clipPath id="f6-clip">
                  <rect x={BAG.x} y={BAG.y} width={BAG.w} height={BAG.h} rx="16" />
                </clipPath>
              </defs>

              <rect width="900" height="560" rx="24" fill="#FFF7E8" />
              <circle cx="450" cy="315" r="218" fill="#FFFFFF" opacity="0.6" />

              {/* drifting powder particles (scrub-converged) */}
              {dots.map((dot, i) => (
                <circle key={i} className="pack-dot" cx={dot.sx} cy={dot.sy} r={dot.r} fill="#C9A96A" opacity="0.8" />
              ))}

              {/* the finished package */}
              <g className="pack-bag" opacity="0">
                {/* soft shadow */}
                <ellipse cx="450" cy="472" rx="130" ry="16" fill="#0A2E52" opacity="0.12" />
                <rect x={BAG.x} y={BAG.y} width={BAG.w} height={BAG.h} rx="16" fill="url(#f6-bag)" stroke="#D9D9D9" strokeWidth="2" />
                {/* top crimp seal */}
                <rect x={BAG.x - 8} y={BAG.y - 4} width={BAG.w + 16} height="26" rx="8" fill="#0A2E52" />
                <line x1={BAG.x} y1={BAG.y + 9} x2={BAG.x + BAG.w} y2={BAG.y + 9} stroke="#FFF7E8" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.6" />

                {/* label */}
                <g textAnchor="middle">
                  <path d="M450 226 c7 10.5 13 17.4 13 24.5 a13 13 0 1 1 -26 0 c0 -7.1 6 -14 13 -24.5z" fill="#0A2E52" />
                  <text x="450" y="298" fontFamily="Calibri, Carlito, sans-serif" fontSize="30" letterSpacing="6" fill="#0A2E52">
                    BELALAK
                  </text>
                  <line x1="395" y1="314" x2="505" y2="314" stroke="#C9A96A" strokeWidth="1.5" />
                  <text x="450" y="340" fontSize="14" letterSpacing="3" fill="#123A66">
                    PREMIUM
                  </text>
                  <text x="450" y="360" fontSize="14" letterSpacing="3" fill="#123A66">
                    MILK POWDER
                  </text>
                  <text x="450" y="412" fontSize="11" letterSpacing="2" fill="#8A7A57">
                    NET WEIGHT 25 KG
                  </text>
                </g>

                {/* sheen sweep, clipped to the bag */}
                <g clipPath="url(#f6-clip)">
                  <rect className="pack-shine" x={BAG.x - 40} y={BAG.y - 20} width="90" height={BAG.h + 40} fill="url(#f6-shine)" transform="skewX(-14)" />
                </g>
              </g>

              {/* Made in Belarus stamp */}
              <g className="pack-badge" opacity="0">
                <circle cx="583" cy="207" r="46" fill="#0A2E52" />
                <circle cx="583" cy="207" r="39" fill="none" stroke="#C9A96A" strokeWidth="1.5" />
                <text x="583" y="198" textAnchor="middle" fontSize="11" letterSpacing="1.5" fill="#FFF7E8">
                  MADE IN
                </text>
                <text x="583" y="216" textAnchor="middle" fontSize="11" letterSpacing="1.5" fill="#C9A96A" fontWeight="700">
                  BELARUS
                </text>
                <text x="583" y="232" textAnchor="middle" fontSize="9" fill="#FFF7E8" opacity="0.7">
                  ★ ★ ★
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
