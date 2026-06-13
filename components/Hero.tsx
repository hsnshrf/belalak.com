"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";

const HEADLINE = "From Pure Belarusian Milk to Premium Milk Powder";
const ACCENT_WORDS = new Set(["Premium", "Milk", "Powder"]);

const SPLASH = [
  { dx: -128, dy: -96, r: 6.5 },
  { dx: -93, dy: -132, r: 5 },
  { dx: -57, dy: -108, r: 6 },
  { dx: -26, dy: -152, r: 4.5 },
  { dx: 8, dy: -162, r: 5.5 },
  { dx: 42, dy: -144, r: 5 },
  { dx: 77, dy: -118, r: 6.5 },
  { dx: 112, dy: -128, r: 4.5 },
  { dx: 142, dy: -92, r: 6 },
  { dx: 28, dy: -102, r: 4 },
];

const DUST = [
  { left: "12%", top: "22%", size: 5, cls: "animate-float-slow" },
  { left: "26%", top: "64%", size: 3, cls: "animate-float-slower" },
  { left: "44%", top: "14%", size: 4, cls: "animate-float-slower" },
  { left: "68%", top: "30%", size: 5, cls: "animate-float-slow" },
  { left: "82%", top: "58%", size: 3, cls: "animate-float-slow" },
  { left: "90%", top: "20%", size: 4, cls: "animate-float-slower" },
];

/**
 * Cinematic hero: a photo-realistic milk drop hangs in space; scrolling
 * lets it fall into a wooden dairy farm bucket. The camera pulls back on
 * scroll to reveal the full bucket. Impact → crown splash → ripples →
 * headline rises. Entirely scrub-driven via one GSAP timeline.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(".hero-drop", { autoAlpha: 0 });
        gsap.set([".hero-word", ".hero-sub", ".hero-ctas"], { autoAlpha: 1, y: 0, yPercent: 0 });
        gsap.set(".hero-hint", { autoAlpha: 0 });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      tl.to(".hero-hint", { autoAlpha: 0, duration: 0.04 }, 0.01);

      tl.fromTo(
        ".hero-camera",
        { scale: 1.9, svgOrigin: "500 360" },
        { scale: 1, svgOrigin: "500 420", duration: 0.46, ease: "power1.inOut" },
        0
      );

      tl.to(".hero-drop", { y: 298, duration: 0.42, ease: "power2.in" }, 0.03);
      tl.to(".hero-drop-shape", { scaleY: 1.22, scaleX: 0.88, transformOrigin: "50% 0%", duration: 0.3 }, 0.08);
      tl.to(
        ".hero-drop-shape",
        { scaleY: 0.18, scaleX: 1.7, autoAlpha: 0, transformOrigin: "50% 100%", duration: 0.04 },
        0.45
      );

      tl.fromTo(
        ".hero-splash",
        { x: 0, y: 0, autoAlpha: 0, scale: 0.4 },
        {
          x: (i) => SPLASH[i].dx,
          y: (i) => SPLASH[i].dy,
          autoAlpha: 1,
          scale: 1,
          duration: 0.07,
          stagger: 0.004,
          ease: "power2.out",
        },
        0.45
      );
      tl.to(".hero-splash", { y: "+=62", autoAlpha: 0, duration: 0.08, ease: "power1.in" }, 0.53);

      tl.fromTo(
        ".hero-ripple",
        { scale: 0.08, autoAlpha: 0.9, svgOrigin: "500 645" },
        { scale: 1, autoAlpha: 0, duration: 0.26, stagger: 0.06, ease: "sine.out" },
        0.455
      );

      tl.to(
        ".hero-surface",
        { scaleY: 0.82, svgOrigin: "500 645", duration: 0.035, repeat: 5, yoyo: true, ease: "sine.inOut" },
        0.45
      );

      tl.fromTo(
        ".hero-word",
        { yPercent: 130 },
        { yPercent: 0, duration: 0.16, stagger: 0.018, ease: "power3.out" },
        0.56
      );
      tl.fromTo(".hero-sub", { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0.74);
      tl.fromTo(".hero-ctas", { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0.82);

      tl.to({}, { duration: 0.06 });
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-label="Belalak Milk — from pure Belarusian milk to premium milk powder"
      className={`relative ${reduced ? "h-screen" : "h-[320vh]"}`}
    >
      <div className="sticky top-0 grain h-screen overflow-hidden bg-gradient-to-b from-deep-950 via-deep-900 to-deep-800">
        {/* Ambient glow */}
        <div className="absolute left-1/2 top-2/3 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/3 rounded-full bg-deep-500/20 blur-[120px]" />

        {DUST.map((d, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`absolute rounded-full bg-milk/30 blur-[1px] ${d.cls}`}
            style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
          />
        ))}

        {/* ——— The scene: wooden dairy bucket + milk drop ——— */}
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            {/* ─── FILTERS ─────────────────────────────────────── */}

            {/* Wood grain: low X / high Y fractalNoise painted as warm browns */}
            <filter id="f-wood" x="-4%" y="-4%" width="108%" height="108%"
                    colorInterpolationFilters="linearRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.005 0.16"
                            numOctaves="4" seed="9" result="wn"/>
              <feColorMatrix
                values="0.42 0 0 0 0.32  0.18 0 0 0 0.14  0 0 0 0 0.04  0 0 0 1 0"
                in="wn" result="wc"/>
              <feBlend in="SourceGraphic" in2="wc" mode="overlay" result="bl"/>
              <feComposite in="bl" in2="SourceGraphic" operator="in"/>
            </filter>

            {/* Brushed metal: high-X noise → subtle grey streaks */}
            <filter id="f-metal" x="-4%" y="-4%" width="108%" height="108%">
              <feTurbulence type="fractalNoise" baseFrequency="0.65 0.02"
                            numOctaves="2" seed="4" result="mn"/>
              <feColorMatrix type="saturate" values="0" in="mn" result="mg"/>
              <feBlend in="SourceGraphic" in2="mg" mode="soft-light" result="bl"/>
              <feComposite in="bl" in2="SourceGraphic" operator="in"/>
            </filter>

            {/* Milk drop: specular lighting for glass-liquid look */}
            <filter id="f-drop" x="-38%" y="-38%" width="176%" height="176%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="b"/>
              <feSpecularLighting in="b" surfaceScale="6" specularConstant="1.6"
                                  specularExponent="28" lightingColor="white" result="sp">
                <fePointLight x="390" y="230" z="220"/>
              </feSpecularLighting>
              <feComposite in="sp" in2="SourceAlpha" operator="in" result="spc"/>
              <feBlend in="SourceGraphic" in2="spc" mode="screen"/>
            </filter>

            {/* ─── GRADIENTS ───────────────────────────────────── */}

            {/* Bucket wood body: dark sides → warm amber centre (horizontal) */}
            <linearGradient id="lg-wood" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#3C1500"/>
              <stop offset="8%"   stopColor="#6B2D0A"/>
              <stop offset="20%"  stopColor="#924A18"/>
              <stop offset="38%"  stopColor="#B96820"/>
              <stop offset="50%"  stopColor="#CE7A2C"/>
              <stop offset="62%"  stopColor="#B96820"/>
              <stop offset="80%"  stopColor="#924A18"/>
              <stop offset="92%"  stopColor="#6B2D0A"/>
              <stop offset="100%" stopColor="#3C1500"/>
            </linearGradient>

            {/* Vertical wood shading overlay */}
            <linearGradient id="lg-wood-v" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#CC7A2C"/>
              <stop offset="40%"  stopColor="#B06018"/>
              <stop offset="100%" stopColor="#7A3A0A"/>
            </linearGradient>

            {/* Top rim face (cross-section seen from above) */}
            <radialGradient id="rg-rim" cx="50%" cy="50%" r="55%">
              <stop offset="0%"   stopColor="#D07C30"/>
              <stop offset="55%"  stopColor="#924A18"/>
              <stop offset="100%" stopColor="#5A2608"/>
            </radialGradient>

            {/* Metal hoop: dark steel → bright silver highlight → dark */}
            <linearGradient id="lg-hoop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#1C2A38"/>
              <stop offset="8%"   stopColor="#3C5268"/>
              <stop offset="22%"  stopColor="#7C9AB4"/>
              <stop offset="38%"  stopColor="#CDD9E4"/>
              <stop offset="50%"  stopColor="#EBF3F8"/>
              <stop offset="62%"  stopColor="#C5D4E2"/>
              <stop offset="78%"  stopColor="#748FA8"/>
              <stop offset="92%"  stopColor="#344858"/>
              <stop offset="100%" stopColor="#1C2A38"/>
            </linearGradient>

            {/* Bucket interior shadow (dark inside, viewed through rim) */}
            <radialGradient id="rg-int" cx="50%" cy="18%" r="82%">
              <stop offset="0%"   stopColor="#1A2E40" stopOpacity="0.95"/>
              <stop offset="55%"  stopColor="#0C1C2C" stopOpacity="0.98"/>
              <stop offset="100%" stopColor="#06101A" stopOpacity="1"/>
            </radialGradient>

            {/* Milk pool: white with subtle blue-grey depth at edges */}
            <radialGradient id="rg-milk" cx="48%" cy="38%" r="70%">
              <stop offset="0%"   stopColor="#FFFFFF"/>
              <stop offset="40%"  stopColor="#F6FAFC"/>
              <stop offset="80%"  stopColor="#E8EFF3"/>
              <stop offset="100%" stopColor="#D4E2E8"/>
            </radialGradient>

            {/* Iron bail handle */}
            <linearGradient id="lg-bail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#7C8A98"/>
              <stop offset="35%"  stopColor="#A8B8C8"/>
              <stop offset="55%"  stopColor="#C5D2DC"/>
              <stop offset="100%" stopColor="#4A5868"/>
            </linearGradient>

            {/* Milk drop: glass-liquid radial — white core → blue-grey edge */}
            <radialGradient id="rg-drop" cx="28%" cy="22%" r="75%">
              <stop offset="0%"   stopColor="#FFFFFF"/>
              <stop offset="16%"  stopColor="#F2F9FF"/>
              <stop offset="42%"  stopColor="#D6ECF8"/>
              <stop offset="72%"  stopColor="#A8CDE0"/>
              <stop offset="100%" stopColor="#72A8C0"/>
            </radialGradient>

            {/* Drop caustic inner glow (bottom-centre bright spot) */}
            <radialGradient id="rg-drop-c" cx="52%" cy="66%" r="36%">
              <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.65"/>
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
            </radialGradient>

            {/* Warm milk tint at drop base */}
            <radialGradient id="rg-drop-warm" cx="50%" cy="82%" r="42%">
              <stop offset="0%"   stopColor="#FFF5E8" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#FFF5E8" stopOpacity="0"/>
            </radialGradient>

            {/* ─── CLIP PATH ───────────────────────────────────── */}
            <clipPath id="cp-drop">
              <path d="M0,-56 C18,-28 36,-4 36,20 A36,36 0 1 1 -36,20 C-36,-4 -18,-28 0,-56 Z"/>
            </clipPath>
          </defs>

          <g className="hero-camera">

            {/* ═══════ WOODEN DAIRY BUCKET ═══════ */}

            {/* Ground shadow */}
            <ellipse cx="500" cy="908" rx="192" ry="27" fill="#000A18" opacity="0.52"/>

            {/* Iron bail (handle arch behind bucket) */}
            <path d="M320 592 A192 88 0 0 1 680 592"
                  fill="none" stroke="url(#lg-bail)" strokeWidth="16"
                  strokeLinecap="round"/>
            {/* Highlight on bail top */}
            <path d="M320 592 A192 88 0 0 1 680 592"
                  fill="none" stroke="#C5D2DC" strokeWidth="4"
                  strokeLinecap="round" opacity="0.45"/>
            {/* Bail attachment rings */}
            <circle cx="312" cy="592" r="12" fill="#4A5868"/>
            <circle cx="312" cy="592" r="6"  fill="#2E3A48"/>
            <circle cx="688" cy="592" r="12" fill="#4A5868"/>
            <circle cx="688" cy="592" r="6"  fill="#2E3A48"/>

            {/* Main wood body */}
            <path d="M302 596 L698 596 L650 882 L350 882 Z"
                  fill="url(#lg-wood)" filter="url(#f-wood)"/>

            {/* Vertical shading overlay (darker at top, darker at base) */}
            <path d="M302 596 L698 596 L650 882 L350 882 Z"
                  fill="url(#lg-wood-v)" opacity="0.32"/>

            {/* Stave divider lines (7 lines → 8 staves) */}
            {Array.from({ length: 7 }, (_, i) => {
              const f = (i + 1) / 8;
              const tx = 302 + f * 396;
              const bx = 350 + f * 300;
              return (
                <line key={i} x1={tx} y1={596} x2={bx} y2={882}
                      stroke="#3A1800" strokeWidth="1.5" opacity="0.42"/>
              );
            })}

            {/* Left-edge shadow (cylindrical illusion) */}
            <path d="M302 596 L342 596 L356 882 L350 882 Z"
                  fill="#180800" opacity="0.52"/>
            {/* Right-edge shadow */}
            <path d="M658 596 L698 596 L650 882 L644 882 Z"
                  fill="#180800" opacity="0.52"/>
            {/* Centre highlight stripe */}
            <path d="M460 596 L540 596 L528 882 L472 882 Z"
                  fill="#FFFFFF" opacity="0.045"/>

            {/* ── METAL HOOPS ── */}

            {/* Top hoop  y≈600 */}
            <path d="M300 598 L700 598 L700 616 L300 616 Z"
                  fill="url(#lg-hoop)" filter="url(#f-metal)"/>
            <line x1="300" y1="599" x2="700" y2="599"
                  stroke="#FFFFFF" strokeWidth="1.5" opacity="0.28"/>
            {[348, 500, 652].map((cx) => (
              <circle key={cx} cx={cx} cy="607" r="5"
                      fill="#2A3A4A" stroke="#1A2A3A" strokeWidth="1"/>
            ))}

            {/* Middle hoop  y≈714 (42% down the 286px height) */}
            <path d="M313 712 L687 712 L683 728 L317 728 Z"
                  fill="url(#lg-hoop)" filter="url(#f-metal)"/>
            <line x1="313" y1="713" x2="687" y2="713"
                  stroke="#FFFFFF" strokeWidth="1.5" opacity="0.28"/>
            {[362, 500, 638].map((cx) => (
              <circle key={cx} cx={cx} cy="720" r="4.5"
                      fill="#2A3A4A" stroke="#1A2A3A" strokeWidth="1"/>
            ))}

            {/* Lower hoop  y≈807 (74% down) */}
            <path d="M330 805 L670 805 L666 820 L334 820 Z"
                  fill="url(#lg-hoop)" filter="url(#f-metal)"/>
            <line x1="330" y1="806" x2="670" y2="806"
                  stroke="#FFFFFF" strokeWidth="1.5" opacity="0.28"/>
            {[378, 500, 622].map((cx) => (
              <circle key={cx} cx={cx} cy="812" r="4"
                      fill="#2A3A4A" stroke="#1A2A3A" strokeWidth="1"/>
            ))}

            {/* Bottom disc */}
            <ellipse cx="500" cy="882" rx="150" ry="26" fill="#2C1200"/>
            <ellipse cx="500" cy="882" rx="140" ry="21" fill="#5A2608"/>

            {/* ── TOP RIM (wood face, 3-D perspective) ── */}

            {/* Outer rim ellipse */}
            <ellipse cx="500" cy="596" rx="200" ry="44" fill="url(#rg-rim)"/>
            <ellipse cx="500" cy="596" rx="200" ry="44" fill="none"
                     stroke="#5A2608" strokeWidth="2.5" opacity="0.65"/>

            {/* Inner rim — shows depth and bucket interior */}
            <ellipse cx="500" cy="596" rx="185" ry="36" fill="url(#rg-int)"/>

            {/* Milk surface (GSAP target: .hero-surface) */}
            <ellipse className="hero-surface"
                     cx="500" cy="645" rx="178" ry="28" fill="url(#rg-milk)"/>

            {/* Caustic light patches on milk */}
            <ellipse cx="472" cy="640" rx="33" ry="10" fill="#FFFFFF" opacity="0.17"/>
            <ellipse cx="528" cy="649" rx="20" ry="7"  fill="#FFFFFF" opacity="0.12"/>

            {/* ── RIPPLES (GSAP-animated) ── */}
            {[0, 1, 2, 3].map((i) => (
              <ellipse key={i} className="hero-ripple"
                cx="500" cy="645"
                rx={52 + i * 38} ry={(52 + i * 38) * 0.157}
                fill="none" stroke="#FFFFFF"
                strokeWidth={2.4 - i * 0.4} opacity="0"/>
            ))}

            {/* ── SPLASH DROPLETS (GSAP-animated) ── */}
            {SPLASH.map((s, i) => (
              <circle key={i} className="hero-splash"
                cx="500" cy="632" r={s.r}
                fill="#EEF6FF" opacity="0"/>
            ))}

            {/* ═══════ PHOTO-REALISTIC MILK DROP ═══════ */}
            <g className="hero-drop" transform="translate(500 330)">
              <g className="hero-drop-shape" filter="url(#f-drop)">
                {/* Drop ambient shadow */}
                <ellipse cx="5" cy="28" rx="24" ry="7"
                         fill="#000A1E" opacity="0.2"/>

                {/* Main body — multi-layer glass depth */}
                <path d="M0,-56 C18,-28 36,-4 36,20 A36,36 0 1 1 -36,20 C-36,-4 -18,-28 0,-56 Z"
                      fill="url(#rg-drop)"/>

                {/* Caustic inner reflection */}
                <path d="M0,-56 C18,-28 36,-4 36,20 A36,36 0 1 1 -36,20 C-36,-4 -18,-28 0,-56 Z"
                      fill="url(#rg-drop-c)" clipPath="url(#cp-drop)"/>

                {/* Warm milk tint at base */}
                <path d="M0,-56 C18,-28 36,-4 36,20 A36,36 0 1 1 -36,20 C-36,-4 -18,-28 0,-56 Z"
                      fill="url(#rg-drop-warm)"/>

                {/* Outer glass-edge rim */}
                <path d="M0,-56 C18,-28 36,-4 36,20 A36,36 0 1 1 -36,20 C-36,-4 -18,-28 0,-56 Z"
                      fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.2"/>

                {/* Primary specular arc (upper-left) */}
                <path d="M-19,-18 C-23,-6 -19,6 -11,12"
                      stroke="#FFFFFF" strokeWidth="7.5"
                      strokeLinecap="round" fill="none" opacity="0.92"/>

                {/* Secondary specular (near tip) */}
                <path d="M-8,-38 C-10,-30 -8,-23 -4,-18"
                      stroke="#FFFFFF" strokeWidth="3.5"
                      strokeLinecap="round" fill="none" opacity="0.75"/>
              </g>
            </g>

          </g>
        </svg>

        {/* ——— Copy overlay ——— */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 pt-20 text-center sm:pt-0">
          <h1 className="max-w-5xl font-serif text-4xl leading-[1.12] text-milk sm:text-6xl lg:text-7xl">
            {HEADLINE.split(" ").map((word, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                <span
                  className={`hero-word inline-block will-change-transform ${
                    ACCENT_WORDS.has(word) && i > 3 ? "italic text-gold-light" : ""
                  }`}
                >
                  {word}
                </span>
                {i < HEADLINE.split(" ").length - 1 && <span>&nbsp;</span>}
              </span>
            ))}
          </h1>

          <p className="hero-sub mt-7 max-w-xl text-base text-deep-100/80 opacity-0 sm:text-lg">
            Crafted through advanced dairy technology.
            <br className="hidden sm:block" /> Trusted by food manufacturers worldwide.
          </p>

          <div className="hero-ctas mt-10 flex flex-col items-center gap-4 opacity-0 sm:flex-row">
            <a href="#products" className="btn-light">
              Explore Products
            </a>
            <a
              href="#process"
              className="btn border border-white/30 bg-deep-900/50 text-milk backdrop-blur-md hover:-translate-y-0.5 hover:bg-deep-900/70"
            >
              Our Process
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="hero-hint absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center">
          <p className="kicker text-milk/60">Scroll</p>
          <div className="mx-auto mt-3 h-12 w-px overflow-hidden bg-milk/20">
            <span className="hint-bead block h-4 w-px bg-milk/90" />
          </div>
        </div>
      </div>
    </section>
  );
}
