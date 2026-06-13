"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";
import StageCopy from "./StageCopy";

/**
 * Stage 1 — fresh milk arrives from Belarusian farms. A tanker truck
 * crosses the scene against parallax countryside at dawn while milk
 * flows through the collection pipeline below.
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

      tl.fromTo(".truck", { x: -380 }, { x: 240, duration: 0.75, ease: "power1.inOut" }, 0.05);
      tl.to(".wheel", { rotation: -900, svgOrigin: "0 0", transformOrigin: "center center", duration: 0.75 }, 0.05);

      tl.fromTo(".par-far",  { x: 0 }, { x: -26, duration: 0.9 }, 0);
      tl.fromTo(".par-mid",  { x: 0 }, { x: -56, duration: 0.9 }, 0);
      tl.fromTo(".par-near", { x: 0 }, { x: -92, duration: 0.9 }, 0);

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
            <svg viewBox="0 0 900 560" className="w-full" role="img"
                 aria-label="Milk tanker collecting fresh milk at dawn on a Belarusian farm">
              <defs>
                {/* Dawn sky: deep blue → warm horizon orange → golden glow */}
                <linearGradient id="c1-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#2A4A72"/>
                  <stop offset="28%"  stopColor="#5880A8"/>
                  <stop offset="55%"  stopColor="#E8935A"/>
                  <stop offset="75%"  stopColor="#F5B870"/>
                  <stop offset="100%" stopColor="#FDE4A0"/>
                </linearGradient>

                {/* Tanker cylindrical shading */}
                <linearGradient id="c1-tank" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#F4F8FC"/>
                  <stop offset="18%"  stopColor="#E0ECF6"/>
                  <stop offset="45%"  stopColor="#B8D0E4"/>
                  <stop offset="72%"  stopColor="#8AAEC8"/>
                  <stop offset="100%" stopColor="#5A88A8"/>
                </linearGradient>

                {/* Cab shading */}
                <linearGradient id="c1-cab" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"  stopColor="#1A3A6A"/>
                  <stop offset="50%" stopColor="#0C2448"/>
                  <stop offset="100%" stopColor="#071830"/>
                </linearGradient>

                {/* Pipeline steel */}
                <linearGradient id="c1-pipe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#E0E8F0"/>
                  <stop offset="30%"  stopColor="#C0CED8"/>
                  <stop offset="70%"  stopColor="#8AAAB8"/>
                  <stop offset="100%" stopColor="#607888"/>
                </linearGradient>

                {/* Bright sun glow */}
                <radialGradient id="c1-sun" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#FFFDE0"/>
                  <stop offset="40%"  stopColor="#FFE680"/>
                  <stop offset="100%" stopColor="#FFD040" stopOpacity="0"/>
                </radialGradient>

                {/* Horizon glow bar */}
                <radialGradient id="c1-horizon" cx="70%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#FF9A30" stopOpacity="0.55"/>
                  <stop offset="100%" stopColor="#FF9A30" stopOpacity="0"/>
                </radialGradient>
              </defs>

              {/* Sky */}
              <rect width="900" height="560" rx="24" fill="url(#c1-sky)"/>

              {/* Horizon glow */}
              <rect x="0" y="270" width="900" height="100" fill="url(#c1-horizon)" opacity="0.7"/>

              {/* Sun */}
              <circle cx="710" cy="115" r="42" fill="url(#c1-sun)"/>
              <circle cx="710" cy="115" r="68" fill="#FFD040" opacity="0.18"/>
              <circle cx="710" cy="115" r="96" fill="#FFBC20" opacity="0.08"/>

              {/* ── Parallax far — distant misty hills + birch silhouettes ── */}
              <g className="par-far">
                <path d="M-60 295 Q80 245 240 280 T560 265 T940 278 V560 H-60 Z" fill="#7BA0C0" opacity="0.55"/>
                {/* Birch tree line */}
                {[80, 180, 280, 380, 580, 680, 780].map((tx, i) => (
                  <g key={i} opacity="0.55">
                    {/* White trunk */}
                    <rect x={tx - 3} y={220 - i % 3 * 15} width="6" height={60 + i % 3 * 15} fill="#E8E8E0" rx="2"/>
                    {/* Dark bark marks */}
                    <rect x={tx - 3} y={228} width="6" height="4" fill="#4A4840" rx="1" opacity="0.5"/>
                    <rect x={tx - 3} y={245} width="6" height="3" fill="#4A4840" rx="1" opacity="0.4"/>
                    {/* Leaf crown */}
                    <ellipse cx={tx} cy={218 - i % 3 * 15} rx={18 + i % 2 * 6} ry={28 + i % 2 * 8} fill="#5A8050" opacity="0.8"/>
                  </g>
                ))}
              </g>

              {/* ── Parallax mid — farm buildings + wheat fields ── */}
              <g className="par-mid">
                <path d="M-80 350 Q200 300 440 345 T980 330 V560 H-80 Z" fill="#9EC0A8" opacity="0.75"/>
                {/* Wheat field stripes */}
                {[100, 140, 180, 220, 260].map((wy) => (
                  <line key={wy} x1="-80" y1={wy + 270} x2="360" y2={wy + 265}
                        stroke="#D4B860" strokeWidth="3" opacity="0.4"/>
                ))}
                {/* Barn */}
                <g>
                  <path d="M545 295 L589 258 L633 295 V365 H545 Z" fill="#8B3018"/>
                  <rect x="545" y="295" width="88" height="70" fill="#A03820"/>
                  {/* Barn door */}
                  <rect x="568" y="330" width="22" height="35" fill="#5A1808" rx="2"/>
                  {/* Roof shingles effect */}
                  <path d="M545 295 L589 258 L633 295" fill="none" stroke="#6A2410" strokeWidth="2"/>
                  {/* Roof highlight */}
                  <path d="M546 294 L589 260 L588 258 L545 295 Z" fill="#C04830" opacity="0.4"/>
                  {/* Loft window */}
                  <rect x="572" y="272" width="14" height="12" fill="#3A0C04" rx="2"/>
                </g>
                {/* Silo */}
                <g>
                  <rect x="648" y="268" width="28" height="97" rx="14" fill="#8098A8"/>
                  <ellipse cx="662" cy="268" rx="14" ry="7" fill="#A0B4C0"/>
                  <rect x="650" y="275" width="24" height="3" fill="#FFFFFF" opacity="0.2"/>
                  <rect x="650" y="308" width="24" height="3" fill="#FFFFFF" opacity="0.2"/>
                </g>
                {/* Wooden fence */}
                {[410, 440, 470, 500, 530].map((fx) => (
                  <g key={fx}>
                    <rect x={fx} y={348} width="5" height="25" fill="#8B6840" rx="2"/>
                    <line x1={fx + 2} y1={350} x2={fx + 2} y2={370}
                          stroke="#A07848" strokeWidth="1" opacity="0.5"/>
                  </g>
                ))}
                <line x1="410" y1="357" x2="532" y2="357" stroke="#8B6840" strokeWidth="4" strokeLinecap="round"/>
                <line x1="410" y1="367" x2="532" y2="367" stroke="#8B6840" strokeWidth="4" strokeLinecap="round"/>
              </g>

              {/* ── Parallax near — lush green foreground ── */}
              <g className="par-near">
                <path d="M-100 430 Q180 390 430 425 T1000 410 V560 H-100 Z" fill="#4E8050" opacity="0.5"/>
                {/* Tall grass tufts */}
                {[50, 120, 200, 350, 500, 650, 750, 820].map((gx, i) => (
                  <g key={gx} opacity="0.6">
                    <path d={`M${gx},440 Q${gx - 5},420 ${gx - 2},408`} fill="none" stroke="#3A6038" strokeWidth="2" strokeLinecap="round"/>
                    <path d={`M${gx + 5},440 Q${gx + 8},418 ${gx + 3},405`} fill="none" stroke="#4A7048" strokeWidth="2" strokeLinecap="round"/>
                    <path d={`M${gx + 10},440 Q${gx + 12},422 ${gx + 8},412`} fill="none" stroke="#3A6038" strokeWidth="2" strokeLinecap="round"/>
                  </g>
                ))}
              </g>

              {/* Road */}
              <rect x="0" y="430" width="900" height="14" fill="#2A3040" opacity="0.6" rx="3"/>
              {/* Road centre dashes */}
              {[50, 130, 210, 290, 370, 450, 530, 610, 690, 770, 850].map((dx) => (
                <rect key={dx} x={dx} y="435" width="60" height="4" fill="#FFFFFF" opacity="0.35" rx="2"/>
              ))}
              {/* Tyre marks */}
              <line x1="0" y1="426" x2="900" y2="426" stroke="#1A2030" strokeWidth="2" opacity="0.4"/>
              <line x1="0" y1="442" x2="900" y2="442" stroke="#1A2030" strokeWidth="2" opacity="0.4"/>

              {/* ── MILK TANKER ── */}
              <g className="truck">
                {/* Trailer tank — cylindrical with proper shading */}
                <rect x="60" y="348" width="248" height="78" rx="39" fill="url(#c1-tank)"
                      stroke="#8AAAC8" strokeWidth="1.5"/>
                {/* Cylinder highlight stripe */}
                <rect x="70" y="352" width="228" height="12" rx="6" fill="#FFFFFF" opacity="0.35"/>
                {/* Tank end caps */}
                <ellipse cx="60"  cy="387" rx="14" ry="39" fill="#C8DDE8"/>
                <ellipse cx="308" cy="387" rx="14" ry="39" fill="#B0CCDC"/>
                {/* Belalak lettering */}
                <text x="190" y="395" textAnchor="middle" fontSize="20"
                      letterSpacing="5" fill="#0A2E52" fontWeight="700" opacity="0.85">
                  BELALAK MILK
                </text>
                {/* Tank fittings */}
                <rect x="168" y="346" width="12" height="8" rx="2" fill="#8AAAB8"/>
                <circle cx="174" cy="346" r="4" fill="#6090A8"/>

                {/* Cab */}
                <path d="M316 430 v-62 q0 -12 12 -12 h44 q10 0 14 8 l22 36 q4 7 4 16 v14 Z"
                      fill="url(#c1-cab)"/>
                {/* Cab windshield */}
                <path d="M332 372 h26 l12 30 h-38 Z" fill="#3A6898" opacity="0.7"/>
                {/* Windshield reflection */}
                <path d="M334 374 h10 l4 10 h-10 Z" fill="#FFFFFF" opacity="0.25"/>
                {/* Door window */}
                <rect x="318" y="374" width="12" height="18" rx="3" fill="#2A5080" opacity="0.6"/>
                {/* Door panel line */}
                <line x1="314" y1="392" x2="314" y2="430" stroke="#0C1C34" strokeWidth="1.5" opacity="0.6"/>
                {/* Step */}
                <rect x="316" y="424" width="20" height="5" rx="2" fill="#162840"/>
                {/* Headlights */}
                <rect x="388" y="398" width="16" height="10" rx="3" fill="#FFFFB0"/>
                <rect x="388" y="398" width="16" height="10" rx="3" fill="#FFFFB0" opacity="0.4"/>
                {/* Front grill */}
                {[404, 412, 420].map((gy) => (
                  <line key={gy} x1="386" y1={gy} x2="400" y2={gy}
                        stroke="#0C1C34" strokeWidth="2" opacity="0.7"/>
                ))}

                {/* Wheels (4 wheels with spokes) */}
                {[108, 198, 290, 380].map((wcx) => (
                  <g key={wcx} transform={`translate(${wcx} 434)`}>
                    <g className="wheel">
                      {/* Tyre */}
                      <circle r="20" fill="#1A1A24"/>
                      <circle r="16" fill="#252530"/>
                      {/* Rim */}
                      <circle r="10" fill="#B0BCCC"/>
                      {/* Hub */}
                      <circle r="5" fill="#8090A0"/>
                      {/* Spokes */}
                      <line x1="-10" y1="0"  x2="10" y2="0"  stroke="#90A0B0" strokeWidth="3"/>
                      <line x1="0"  y1="-10" x2="0"  y2="10" stroke="#90A0B0" strokeWidth="3"/>
                      <line x1="-7" y1="-7"  x2="7"  y2="7"  stroke="#90A0B0" strokeWidth="2"/>
                      <line x1="7"  y1="-7"  x2="-7" y2="7"  stroke="#90A0B0" strokeWidth="2"/>
                    </g>
                  </g>
                ))}

                {/* Mud flaps */}
                <rect x="86"  y="424" width="12" height="18" rx="2" fill="#1A1A24" opacity="0.7"/>
                <rect x="270" y="424" width="12" height="18" rx="2" fill="#1A1A24" opacity="0.7"/>
              </g>

              {/* ── COLLECTION PIPELINE ── */}
              <g>
                {/* Pipe shadow */}
                <rect x="38" y="504" width="824" height="32" rx="16" fill="#000814" opacity="0.2"/>
                {/* Main pipe */}
                <rect x="40" y="498" width="820" height="30" rx="15" fill="url(#c1-pipe)"
                      stroke="#8AAAB8" strokeWidth="1.5"/>
                {/* Pipe top highlight */}
                <rect x="48" y="500" width="804" height="8" rx="4" fill="#FFFFFF" opacity="0.35"/>
                {/* Pipe joints */}
                {[200, 440, 680].map((pj) => (
                  <rect key={pj} x={pj - 8} y="494" width="16" height="38" rx="8"
                                 fill="#A0B8C8" stroke="#6890A8" strokeWidth="1.5"/>
                ))}
                {/* Flowing milk (GSAP target) */}
                <line className="flow-dash pipe-milk" x1="56" y1="513" x2="844" y2="513"
                      stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" opacity="0"/>
                {/* Intake riser */}
                <rect x="598" y="444" width="16" height="58" rx="8" fill="url(#c1-pipe)"
                      stroke="#8AAAB8" strokeWidth="1.5"/>
                {/* Intake flange */}
                <rect x="590" y="452" width="32" height="8" rx="4" fill="#A0B8C8"/>
                <rect x="590" y="488" width="32" height="8" rx="4" fill="#A0B8C8"/>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
