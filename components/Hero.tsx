"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";

const HEADLINE = "From Pure Belarusian Milk to Premium Milk Powder";
// Words rendered in italic gold serif for emphasis.
const ACCENT_WORDS = new Set(["Premium", "Milk", "Powder"]);

// Deterministic splash-droplet geometry (Math.random in render would
// break SSR hydration).
const SPLASH = [
  { dx: -130, dy: -95, r: 6 },
  { dx: -95, dy: -130, r: 4.5 },
  { dx: -60, dy: -105, r: 5.5 },
  { dx: -28, dy: -150, r: 4 },
  { dx: 6, dy: -160, r: 5 },
  { dx: 40, dy: -140, r: 4.5 },
  { dx: 75, dy: -115, r: 6 },
  { dx: 110, dy: -125, r: 4 },
  { dx: 140, dy: -90, r: 5.5 },
  { dx: 28, dy: -100, r: 3.5 },
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
 * Cinematic hero: a single milk drop hangs in space; scrolling lets it
 * fall while the "camera" (an SVG group scale) pulls back to reveal a
 * stainless collection tank. Impact triggers splash + ripples, then the
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
        // Static final frame: drop gone, copy visible.
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

      // Scroll hint disappears the moment the story starts.
      tl.to(".hero-hint", { autoAlpha: 0, duration: 0.04 }, 0.01);

      // Camera pull-back: starts framed tight on the suspended drop
      // (tank hidden below the frame), ends on the wide shot of the tank.
      tl.fromTo(
        ".hero-camera",
        { scale: 1.9, svgOrigin: "500 360" },
        { scale: 1, svgOrigin: "500 420", duration: 0.46, ease: "power1.inOut" },
        0
      );

      // The drop accelerates under gravity (power2.in) towards the milk
      // surface at y≈645, stretching slightly as it gains speed.
      tl.to(".hero-drop", { y: 298, duration: 0.42, ease: "power2.in" }, 0.03);
      tl.to(".hero-drop-shape", { scaleY: 1.22, scaleX: 0.88, transformOrigin: "50% 0%", duration: 0.3 }, 0.08);

      // Impact: squash and vanish into the surface.
      tl.to(
        ".hero-drop-shape",
        { scaleY: 0.18, scaleX: 1.7, autoAlpha: 0, transformOrigin: "50% 100%", duration: 0.04 },
        0.45
      );

      // Crown splash bursting out of the tank mouth.
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
      tl.to(".hero-splash", { y: "+=60", autoAlpha: 0, duration: 0.08, ease: "power1.in" }, 0.53);

      // Concentric ripples spreading across the milk surface.
      tl.fromTo(
        ".hero-ripple",
        { scale: 0.08, autoAlpha: 0.9, svgOrigin: "500 645" },
        { scale: 1, autoAlpha: 0, duration: 0.26, stagger: 0.06, ease: "sine.out" },
        0.455
      );

      // The surface itself shivers from the impact.
      tl.to(
        ".hero-surface",
        { scaleY: 0.82, svgOrigin: "500 645", duration: 0.035, repeat: 5, yoyo: true, ease: "sine.inOut" },
        0.45
      );

      // Headline rises word by word out of masked line boxes.
      tl.fromTo(
        ".hero-word",
        { yPercent: 130 },
        { yPercent: 0, duration: 0.16, stagger: 0.018, ease: "power3.out" },
        0.56
      );
      tl.fromTo(".hero-sub", { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0.74);
      tl.fromTo(".hero-ctas", { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0.82);

      // Brief hold so the finished frame breathes before the next section.
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
        {/* Ambient glow behind the tank */}
        <div className="absolute left-1/2 top-2/3 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/3 rounded-full bg-deep-500/20 blur-[120px]" />

        {/* Floating dust motes for depth */}
        {DUST.map((d, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`absolute rounded-full bg-milk/30 blur-[1px] ${d.cls}`}
            style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
          />
        ))}

        {/* ——— The scene: drop, tank, ripples (one SVG = exact alignment) ——— */}
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#5B6B7C" />
              <stop offset="0.18" stopColor="#9FB0C0" />
              <stop offset="0.42" stopColor="#E6EDF3" />
              <stop offset="0.6" stopColor="#AEBDCB" />
              <stop offset="0.82" stopColor="#6E7E8F" />
              <stop offset="1" stopColor="#46566A" />
            </linearGradient>
            <linearGradient id="steelRim" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7C8C9D" />
              <stop offset="0.5" stopColor="#F2F6FA" />
              <stop offset="1" stopColor="#5B6B7C" />
            </linearGradient>
            <radialGradient id="milkPool" cx="0.5" cy="0.42" r="0.75">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.75" stopColor="#F2F2EE" />
              <stop offset="1" stopColor="#DDE2E3" />
            </radialGradient>
            <linearGradient id="dropGrad" x1="0.3" y1="0" x2="0.7" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#D8E2EA" />
            </linearGradient>
          </defs>

          <g className="hero-camera">
            {/* Collection tank */}
            <g>
              {/* legs */}
              <rect x="305" y="930" width="22" height="60" rx="6" fill="#33414F" />
              <rect x="673" y="930" width="22" height="60" rx="6" fill="#33414F" />
              {/* body */}
              <path
                d="M270 645 L270 900 Q270 960 330 960 L670 960 Q730 960 730 900 L730 645 Z"
                fill="url(#steel)"
              />
              {/* polished band details */}
              <rect x="270" y="700" width="460" height="10" fill="#FFFFFF" opacity="0.12" />
              <rect x="270" y="850" width="460" height="10" fill="#0A2E52" opacity="0.14" />
              <rect x="300" y="660" width="8" height="280" rx="4" fill="#FFFFFF" opacity="0.35" />
              {/* outlet valve */}
              <rect x="724" y="800" width="46" height="16" rx="8" fill="#46566A" />
              <circle cx="778" cy="808" r="13" fill="#9FB0C0" />
              {/* rim */}
              <ellipse cx="500" cy="645" rx="232" ry="42" fill="url(#steelRim)" />
              {/* milk surface */}
              <ellipse className="hero-surface" cx="500" cy="645" rx="206" ry="32" fill="url(#milkPool)" />
            </g>

            {/* Impact ripples (scrub-animated) */}
            {[0, 1, 2, 3].map((i) => (
              <ellipse
                key={i}
                className="hero-ripple"
                cx="500"
                cy="645"
                rx={60 + i * 46}
                ry={(60 + i * 46) * 0.15}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={3 - i * 0.5}
                opacity="0"
              />
            ))}

            {/* Splash droplets (scrub-animated) */}
            {SPLASH.map((s, i) => (
              <circle key={i} className="hero-splash" cx="500" cy="632" r={s.r} fill="#FFFFFF" opacity="0" />
            ))}

            {/* The milk drop, suspended at y=330 before the user scrolls */}
            <g className="hero-drop" transform="translate(500 330)">
              <g className="hero-drop-shape">
                <path
                  d="M0 -52 C 14 -26 30 -8 30 14 A 30 30 0 1 1 -30 14 C -30 -8 -14 -26 0 -52 Z"
                  fill="url(#dropGrad)"
                />
                {/* specular highlight */}
                <path
                  d="M-12 2 C -14 12 -10 22 -2 26"
                  stroke="#FFFFFF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.85"
                />
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
