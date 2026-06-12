"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";
import StageCopy from "./StageCopy";

/**
 * Stage 1 — fresh milk arrives from Belarusian farms. A tanker truck
 * crosses the scene against parallax countryside while milk flows
 * through the collection pipeline below.
 */
export default function StageCollection() {
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

      // Truck drives in from off-screen and parks by the pipeline intake.
      tl.fromTo(".truck", { x: -380 }, { x: 240, duration: 0.75, ease: "power1.inOut" }, 0.05);
      tl.to(".wheel", { rotation: -900, svgOrigin: "0 0", transformOrigin: "center center", duration: 0.75 }, 0.05);

      // Countryside layers drift at different speeds — classic parallax.
      tl.fromTo(".par-far", { x: 0 }, { x: -26, duration: 0.9 }, 0);
      tl.fromTo(".par-mid", { x: 0 }, { x: -56, duration: 0.9 }, 0);
      tl.fromTo(".par-near", { x: 0 }, { x: -92, duration: 0.9 }, 0);

      // Once the truck arrives, the pipeline milk flow fades in.
      tl.fromTo(".pipe-milk", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.72);
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={ref} className={`relative bg-gradient-to-b from-cream to-milk ${reduced ? "" : "h-[180vh]"}`}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="container-site grid w-full items-center gap-10 py-20 lg:grid-cols-2 lg:gap-16">
          <StageCopy
            index={1}
            kicker="Milk Collection"
            title="It begins in the Belarusian countryside."
            text="Fresh milk is collected daily from carefully selected Belarusian dairy farms."
            tone="light"
          />

          <div className="relative">
            <svg viewBox="0 0 900 560" className="w-full" role="img" aria-label="Milk tanker collecting fresh milk from Belarusian farms">
              <defs>
                <linearGradient id="c1-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFF7E8" />
                  <stop offset="1" stopColor="#EEF4FA" />
                </linearGradient>
                <linearGradient id="c1-tank" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#F2F6FA" />
                  <stop offset="0.5" stopColor="#C9D5E0" />
                  <stop offset="1" stopColor="#8FA2B5" />
                </linearGradient>
              </defs>

              <rect width="900" height="560" rx="24" fill="url(#c1-sky)" />

              {/* sun */}
              <circle cx="700" cy="110" r="46" fill="#FFE9BC" />
              <circle cx="700" cy="110" r="78" fill="#FFE9BC" opacity="0.3" />

              {/* parallax countryside */}
              <g className="par-far">
                <path d="M-40 320 Q160 240 380 305 T940 290 V560 H-40 Z" fill="#D7E4F2" />
              </g>
              <g className="par-mid">
                <path d="M-60 380 Q220 300 470 365 T960 350 V560 H-60 Z" fill="#AFC9E5" opacity="0.7" />
                {/* farm: barn + silo */}
                <g fill="#0A2E52" opacity="0.85">
                  <path d="M560 330 l44 -34 44 34 v54 h-88 Z" />
                  <rect x="664" y="300" width="26" height="84" rx="8" />
                  <path d="M664 300 a13 13 0 0 1 26 0 Z" />
                </g>
              </g>
              <g className="par-near">
                <path d="M-80 440 Q260 380 560 430 T980 420 V560 H-80 Z" fill="#7FA8D3" opacity="0.45" />
              </g>

              {/* road */}
              <rect x="0" y="438" width="900" height="8" fill="#0A2E52" opacity="0.18" />

              {/* milk tanker */}
              <g className="truck">
                {/* trailer tank */}
                <rect x="70" y="352" width="240" height="76" rx="38" fill="url(#c1-tank)" stroke="#5B6B7C" strokeWidth="2" />
                <text x="190" y="397" textAnchor="middle" fontSize="22" letterSpacing="4" fill="#0A2E52" fontWeight="600">
                  BELALAK
                </text>
                {/* cab */}
                <path d="M318 428 v-58 q0 -10 10 -10 h40 q8 0 12 7 l20 33 q4 7 4 14 v14 Z" fill="#0A2E52" />
                <rect x="334" y="370" width="28" height="22" rx="4" fill="#AFC9E5" />
                {/* wheels with spokes so rotation reads */}
                {[120, 200, 280, 372].map((cx) => (
                  <g key={cx} transform={`translate(${cx} 432)`}>
                    <g className="wheel">
                      <circle r="18" fill="#0A2E52" />
                      <circle r="8" fill="#D9D9D9" />
                      <line x1="-14" y1="0" x2="14" y2="0" stroke="#D9D9D9" strokeWidth="3" />
                      <line x1="0" y1="-14" x2="0" y2="14" stroke="#D9D9D9" strokeWidth="3" />
                    </g>
                  </g>
                ))}
              </g>

              {/* collection pipeline */}
              <g>
                <rect x="40" y="500" width="820" height="26" rx="13" fill="#C9D5E0" stroke="#8FA2B5" strokeWidth="2" />
                <line className="flow-dash pipe-milk" x1="56" y1="513" x2="844" y2="513" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
                {/* intake riser from truck position down to pipeline */}
                <rect x="600" y="446" width="14" height="58" rx="7" fill="#C9D5E0" stroke="#8FA2B5" strokeWidth="2" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
