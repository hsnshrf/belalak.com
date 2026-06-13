"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";

const PARTICLE_COUNT = 380;

/** Deterministic PRNG so the particle field is stable between mounts. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const PHASES = [
  { word: "MILK", label: "Liquid concentrate" },
  { word: "PARTICLES", label: "Fine atomization" },
  { word: "POWDER", label: "Premium dairy powder" },
];

/**
 * Stage 5 — the spray-drying tower, the centerpiece of the journey.
 *
 * A canvas particle system is driven by scroll progress: a cohesive
 * liquid stream (progress ≈ 0) atomizes into a wide cone of fine
 * droplets (≈ 0.5) which dry into slow-drifting cream powder that
 * settles into a growing pile (→ 1). Time-based motion keeps the system
 * alive even while the user pauses scrolling.
 */
export default function StageSprayDrying() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const activeRef = useRef(false);
  const reduced = usePrefersReducedMotion();

  // ——— particle rendering ———
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const rand = mulberry32(20260612);
    const seeds = Array.from({ length: PARTICLE_COUNT }, () => ({
      a: rand(),
      b: rand(),
      c: rand(),
    }));

    let raf = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (time: number) => {
      const p = reduced ? 1 : progressRef.current;
      const t = time / 1000;
      ctx2d.clearRect(0, 0, width, height);

      const cx = width / 2;
      const nozzleY = height * 0.1;
      const floorY = height * 0.88;
      const atomize = smoothstep(0.08, 0.48, p);
      const powder = smoothstep(0.5, 0.85, p);
      const fall = lerp(0.5, 0.14, powder); // liquid falls fast, powder drifts
      const spreadMax = lerp(7, width * 0.36, atomize);
      const pileH = smoothstep(0.55, 0.98, p) * height * 0.11;

      // settled powder pile
      if (pileH > 1) {
        const grad = ctx2d.createLinearGradient(0, floorY - pileH * 2, 0, floorY);
        grad.addColorStop(0, "rgba(255,247,232,0.95)");
        grad.addColorStop(1, "rgba(228,204,155,0.85)");
        ctx2d.fillStyle = grad;
        ctx2d.beginPath();
        ctx2d.moveTo(cx - width * 0.34, floorY);
        ctx2d.quadraticCurveTo(cx, floorY - pileH * 2.3, cx + width * 0.34, floorY);
        ctx2d.closePath();
        ctx2d.fill();
      }

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const s = seeds[i];
        const travel = (s.a + t * fall * (0.7 + s.c * 0.6)) % 1;
        const y = nozzleY + travel * (floorY - nozzleY);

        const dir = s.b * 2 - 1;
        const wobble = Math.sin(t * 1.6 + s.a * 40) * (1 + 9 * powder);
        const x = cx + dir * Math.pow(travel, 0.72) * spreadMax + wobble;

        // particles landing on the pile are absorbed
        const distFromCenter = Math.abs(x - cx) / (width * 0.34);
        const pileAtX = pileH * 2.3 * Math.max(0, 1 - distFromCenter * distFromCenter) * 0.5;
        if (y > floorY - pileAtX) continue;

        const r = lerp(3, 1.3, atomize) * (0.6 + s.c * 0.8);
        // colour shifts from cool liquid white to warm powder cream
        const cr = Math.round(lerp(228, 255, powder));
        const cg = Math.round(lerp(240, 247, powder));
        const cb = Math.round(lerp(252, 232, powder));
        const alpha = 0.92 * (1 - smoothstep(0.92, 1, travel));

        ctx2d.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx2d.beginPath();
        ctx2d.arc(x, y, r, 0, Math.PI * 2);
        ctx2d.fill();
      }

      // feed stream at the nozzle while still liquid
      if (atomize < 1) {
        ctx2d.fillStyle = `rgba(235,244,252,${0.85 * (1 - atomize)})`;
        ctx2d.fillRect(cx - 3, 0, 6, nozzleY);
      }
    };

    if (reduced) {
      // single static frame of the finished state
      draw(1800);
    } else {
      const loop = (time: number) => {
        if (activeRef.current) draw(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [reduced]);

  // ——— scroll choreography: progress + phase label crossfades ———
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
          onToggle: (self) => {
            activeRef.current = self.isActive;
          },
        },
      });

      tl.fromTo(".stage-copy", { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.15, ease: "power2.out" }, 0.02);

      // Watermark words + side labels follow the physical transformation.
      tl.set(".phase-word-0", { autoAlpha: 0.16 }, 0);
      tl.to(".phase-word-0", { autoAlpha: 0, duration: 0.12 }, 0.24);
      tl.fromTo(".phase-word-1", { autoAlpha: 0 }, { autoAlpha: 0.16, duration: 0.12 }, 0.3);
      tl.to(".phase-word-1", { autoAlpha: 0, duration: 0.12 }, 0.56);
      tl.fromTo(".phase-word-2", { autoAlpha: 0 }, { autoAlpha: 0.16, duration: 0.12 }, 0.66);

      tl.set(".phase-item-0", { opacity: 1 }, 0);
      tl.to(".phase-item-0", { opacity: 0.3, duration: 0.1 }, 0.26);
      tl.fromTo(".phase-item-1", { opacity: 0.3 }, { opacity: 1, duration: 0.1 }, 0.3);
      tl.to(".phase-item-1", { opacity: 0.3, duration: 0.1 }, 0.58);
      tl.fromTo(".phase-item-2", { opacity: 0.3 }, { opacity: 1, duration: 0.1 }, 0.66);
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={sectionRef} className={`relative grain bg-deep-950 ${reduced ? "" : "h-[300vh]"}`}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        {/* gigantic watermark words behind the tower */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          {PHASES.map((phase, i) => (
            <span
              key={phase.word}
              className={`phase-word-${i} absolute font-serif text-[18vw] leading-none tracking-tight text-milk opacity-0 lg:text-[13vw]`}
            >
              {phase.word}
            </span>
          ))}
        </div>

        <div className="container-site relative grid w-full flex-1 items-center gap-8 py-24 lg:grid-cols-[1fr_minmax(300px,420px)_1fr]">
          {/* phase tracker */}
          <ol className="order-2 flex justify-center gap-6 lg:order-1 lg:flex-col lg:gap-10" aria-label="Transformation phases">
            {PHASES.map((phase, i) => (
              <li key={phase.word} className={`phase-item-${i} transition-opacity`} style={{ opacity: i === 0 ? 1 : 0.3 }}>
                <span className="kicker text-gold-light">0{i + 1}</span>
                <p className="mt-1 font-serif text-xl text-milk sm:text-2xl">{phase.word}</p>
                <p className="mt-1 hidden text-sm text-deep-100/60 lg:block">{phase.label}</p>
              </li>
            ))}
          </ol>

          {/* the drying tower with its live particle canvas */}
          <div className="relative order-1 mx-auto h-[52vh] w-full max-w-[420px] lg:order-2 lg:h-[68vh]">
            <svg viewBox="0 0 420 720" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                {/* Chamber wall: dark metallic sides, transparent centre for the canvas */}
                <linearGradient id="s5-wall" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#0E2A48" stopOpacity="0.88"/>
                  <stop offset="18%"  stopColor="#1A4070" stopOpacity="0.55"/>
                  <stop offset="40%"  stopColor="#1E4878" stopOpacity="0.12"/>
                  <stop offset="60%"  stopColor="#1E4878" stopOpacity="0.12"/>
                  <stop offset="82%"  stopColor="#1A4070" stopOpacity="0.55"/>
                  <stop offset="100%" stopColor="#0E2A48" stopOpacity="0.88"/>
                </linearGradient>
                {/* Hot-air inlet glow */}
                <radialGradient id="s5-airglow" cx="0%" cy="50%" r="100%">
                  <stop offset="0%"   stopColor="#E0901A" stopOpacity="0.7"/>
                  <stop offset="100%" stopColor="#C07010" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="s5-airglow-r" cx="100%" cy="50%" r="100%">
                  <stop offset="0%"   stopColor="#E0901A" stopOpacity="0.7"/>
                  <stop offset="100%" stopColor="#C07010" stopOpacity="0"/>
                </radialGradient>
                {/* Feed pipe gradient */}
                <linearGradient id="s5-pipe" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#1A3A60"/>
                  <stop offset="35%"  stopColor="#3A6898"/>
                  <stop offset="65%"  stopColor="#4878A8"/>
                  <stop offset="100%" stopColor="#1A3A60"/>
                </linearGradient>
              </defs>

              {/* Tower structure support legs */}
              <rect x="40"  y="558" width="14" height="120" rx="7" fill="#1A3050"/>
              <rect x="366" y="558" width="14" height="120" rx="7" fill="#1A3050"/>
              {/* Cross brace */}
              <line x1="54" y1="628" x2="366" y2="628" stroke="#1A3050" strokeWidth="6" strokeLinecap="round"/>

              {/* Chamber body */}
              <path d="M40 60 H380 V520 L240 660 H180 L40 520 Z"
                    fill="url(#s5-wall)"/>

              {/* Chamber outer wall stroke */}
              <path d="M40 60 H380 V520 L240 660 H180 L40 520 Z"
                    fill="none" stroke="#4F86C0" strokeWidth="2.5" strokeOpacity="0.7"/>

              {/* Panel weld seams (horizontal) */}
              {[160, 260, 380, 480].map((wy) => (
                <line key={wy} x1="40" y1={wy} x2="380" y2={wy}
                      stroke="#3A6898" strokeWidth="1.5" opacity="0.4"/>
              ))}

              {/* Rivet lines along left and right sides */}
              {[100, 160, 220, 280, 340, 400, 460].map((ry) => (
                <g key={ry}>
                  <circle cx="46"  cy={ry} r="3.5" fill="#3A6080" opacity="0.6"/>
                  <circle cx="374" cy={ry} r="3.5" fill="#3A6080" opacity="0.6"/>
                </g>
              ))}

              {/* Inspection windows */}
              <ellipse cx="86" cy="300" rx="22" ry="28" fill="#0A1A2E" stroke="#4070A8" strokeWidth="2"/>
              <ellipse cx="86" cy="300" rx="16" ry="21" fill="#0E2040" opacity="0.9"/>
              <ellipse cx="82" cy="294" rx="7"  ry="9"  fill="#FFFFFF" opacity="0.06"/>
              <ellipse cx="334" cy="300" rx="22" ry="28" fill="#0A1A2E" stroke="#4070A8" strokeWidth="2"/>
              <ellipse cx="334" cy="300" rx="16" ry="21" fill="#0E2040" opacity="0.9"/>

              {/* Hot-air inlets LEFT — with amber glow */}
              <rect x="2" y="128" width="42" height="28" rx="8" fill="url(#s5-airglow)"/>
              <rect x="2" y="188" width="42" height="28" rx="8" fill="url(#s5-airglow)"/>
              <path d="M2 140 h38 M2 200 h38"
                    stroke="#C9A96A" strokeWidth="3" strokeDasharray="6 6"
                    className="flow-dash-slow" fill="none"/>
              {/* Duct labels */}
              <text x="10" y="126" fontSize="9" fill="#C9A96A" opacity="0.7" letterSpacing="1">HOT</text>
              <text x="10" y="186" fontSize="9" fill="#C9A96A" opacity="0.7" letterSpacing="1">AIR</text>

              {/* Hot-air inlets RIGHT */}
              <rect x="376" y="128" width="42" height="28" rx="8" fill="url(#s5-airglow-r)"/>
              <rect x="376" y="188" width="42" height="28" rx="8" fill="url(#s5-airglow-r)"/>
              <path d="M380 140 h38 M380 200 h38"
                    stroke="#C9A96A" strokeWidth="3" strokeDasharray="6 6"
                    className="flow-dash-slow" fill="none"/>

              {/* Feed pipe (top) */}
              <rect x="193" y="4" width="34" height="50" rx="10"
                    fill="url(#s5-pipe)" stroke="#4070A0" strokeWidth="2"/>
              {/* Pipe highlight */}
              <rect x="197" y="6" width="10" height="44" rx="5" fill="#FFFFFF" opacity="0.14"/>
              {/* Pipe flanges */}
              <rect x="186" y="8"  width="48" height="10" rx="5" fill="#3A6090"/>
              <rect x="186" y="36" width="48" height="10" rx="5" fill="#3A6090"/>
              {/* Pressure gauge */}
              <circle cx="172" cy="28" r="14" fill="#0A1E30" stroke="#3A6090" strokeWidth="1.5"/>
              <circle cx="172" cy="28" r="10" fill="#0E2848"/>
              <line x1="172" y1="28" x2="172" y2="20" stroke="#C9A96A" strokeWidth="2" strokeLinecap="round"/>

              {/* Nozzle assembly */}
              <path d="M186 54 h48 l-10 22 h-28 Z" fill="#4878A8" stroke="#3A6090" strokeWidth="1.5"/>
              <rect x="200" y="74" width="20" height="8" rx="4" fill="#3A6090"/>
              <circle cx="210" cy="76" r="5" fill="#6090C0"/>

              {/* Outlet cyclone at bottom */}
              <rect x="183" y="660" width="54" height="52" rx="10"
                    fill="#0E2848" stroke="#4070A0" strokeWidth="2"/>
              <rect x="187" y="662" width="46" height="16" rx="6" fill="#1A3A60"/>
              {/* Cyclone swirl indicator */}
              <path d="M190 680 Q210 672 230 682 Q218 694 200 688 Q188 684 190 680 Z"
                    fill="none" stroke="#4878A8" strokeWidth="1.5" opacity="0.6"/>
              {/* Outlet pipe below */}
              <rect x="198" y="710" width="24" height="10" rx="5" fill="#0E2848" stroke="#3A6090" strokeWidth="1.5"/>
            </svg>

            {/* particle field clipped to the chamber interior */}
            <canvas
              ref={canvasRef}
              className="absolute inset-x-[12%] top-[9%] h-[81%] w-[76%]"
              aria-hidden="true"
            />
          </div>

          {/* copy */}
          <div className="stage-copy order-3 max-w-md lg:justify-self-end">
            <p className="kicker text-gold-light">Stage 05 — Spray Drying</p>
            <h3 className="mt-4 font-serif text-3xl leading-tight text-milk sm:text-4xl text-balance">
              The transformation, witnessed.
            </h3>
            <p className="mt-5 text-base leading-relaxed text-deep-100/75 sm:text-lg">
              Advanced spray-drying technology transforms liquid milk into premium dairy powder.
            </p>
            <p className="mt-4 text-sm text-deep-100/50">
              Keep scrolling — liquid milk atomizes into fine droplets and dries into powder before your eyes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
