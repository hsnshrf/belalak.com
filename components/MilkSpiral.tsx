"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/hooks";

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DUST_COUNT = 180;
// Deterministic dust particle seeds
const rand = mulberry32(20260613);
const DUST_SEEDS = Array.from({ length: DUST_COUNT }, () => ({
  a: rand(), b: rand(), c: rand(), d: rand(),
}));

const PHASES = [
  { num: "01", label: "Liquid Milk",  sub: "Fresh concentrate" },
  { num: "02", label: "Atomization",  sub: "Fine mist" },
  { num: "03", label: "Milk Powder",  sub: "Premium product" },
];

/**
 * A scroll-driven canvas section that shows liquid milk spiraling down
 * the centre of the page and transforming into premium powder at the bottom.
 * The transition is continuous: liquid → atomised droplets → dry powder.
 */
export default function MilkSpiral() {
  const sectionRef  = useRef<HTMLElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const activeRef   = useRef(false);
  const reduced     = usePrefersReducedMotion();

  // ——— Canvas rendering ———
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let W = 0, H = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr  = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (time: number) => {
      const p  = reduced ? 1 : progressRef.current;
      const t  = time / 1000;

      ctx.clearRect(0, 0, W, H);

      const cx      = W / 2;
      const topY    = H * 0.06;
      const botY    = H * 0.92;
      const spiralH = botY - topY;

      const atomize  = smoothstep(0.22, 0.62, p);
      const powder   = smoothstep(0.52, 0.88, p);
      const liquidOp = 1 - smoothstep(0.28, 0.68, p);
      const dustOp   = smoothstep(0.38, 0.68, p);

      // — central liquid stream (liquid phase) —
      if (liquidOp > 0.01) {
        const sWidth = lerp(11, 4, atomize);
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const fy = i / 80;
          const y  = topY + fy * spiralH;
          const wobble = Math.sin(t * 1.1 + fy * 10) * 4 * fy * (1 - atomize * 0.8);
          const x  = cx + wobble;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const sg = ctx.createLinearGradient(0, topY, 0, botY);
        sg.addColorStop(0,   `rgba(255,252,250,${liquidOp * 0.88})`);
        sg.addColorStop(0.5, `rgba(228,244,255,${liquidOp * 0.78})`);
        sg.addColorStop(1,   `rgba(198,224,242,${liquidOp * 0.55})`);
        ctx.strokeStyle = sg;
        ctx.lineWidth   = sWidth;
        ctx.lineCap     = "round";
        ctx.stroke();
      }

      // — spiral strands (2 interleaved helices) —
      const STRANDS   = 2;
      const ROTATIONS = 3.5;
      const maxRadius = W * 0.26;
      const POINTS    = 130;

      for (let s = 0; s < STRANDS; s++) {
        const phase = (s / STRANDS) * Math.PI * 2;
        for (let i = 0; i < POINTS; i++) {
          const fy     = i / (POINTS - 1);
          const y      = topY + fy * spiralH;
          const angle  = fy * ROTATIONS * Math.PI * 2 + phase + t * 0.28 * (1 - atomize * 0.9);
          const radius = maxRadius * Math.pow(fy, 0.65) * lerp(1, 0.55, powder);
          const x      = cx + Math.cos(angle) * radius;

          const dotR = lerp(5.5, 1.6, fy) * lerp(1, 0.55, powder) * (0.7 + 0.3 * DUST_SEEDS[i % DUST_COUNT].c);

          const cr    = Math.round(lerp(245, 255, powder));
          const cg    = Math.round(lerp(250, 246, powder));
          const cb    = Math.round(lerp(255, 222, powder));

          const prog  = smoothstep(0, 0.12 + fy * 0.28, p);
          const alpha = 0.82 * prog * (1 - smoothstep(0.88, 1, fy) * powder);

          if (alpha < 0.02 || dotR < 0.3) continue;

          ctx.beginPath();
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.fill();
        }
      }

      // — scattered powder dust (late phase) —
      if (dustOp > 0.02) {
        for (let i = 0; i < DUST_COUNT; i++) {
          const ds     = DUST_SEEDS[i];
          const yBase  = topY + spiralH * (0.38 + ds.a * 0.56);
          const xBase  = cx + (ds.b * 2 - 1) * W * 0.40;
          const wobble = Math.sin(t * (0.28 + ds.c * 0.36) + ds.d * 9) * 7;
          const x      = xBase + wobble;
          const y      = yBase;

          const r     = 1.0 + ds.c * 2.8;
          const yFrac = (y - topY) / spiralH;
          const alpha = dustOp * (0.38 + ds.d * 0.52)
            * smoothstep(0, 0.06, yFrac)
            * (1 - smoothstep(0.92, 1, yFrac));

          if (alpha < 0.02) continue;

          const bright = Math.round(215 + ds.c * 40);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${bright},${Math.round(bright * 0.95)},${Math.round(bright * 0.86)},${alpha})`;
          ctx.fill();
        }
      }

      // — nozzle glow (liquid phase) —
      if (liquidOp > 0.08) {
        const gg = ctx.createRadialGradient(cx, topY, 0, cx, topY, 55);
        gg.addColorStop(0, `rgba(200,232,255,${liquidOp * 0.28})`);
        gg.addColorStop(1, "rgba(200,232,255,0)");
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(cx, topY, 55, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (reduced) {
      draw(2200);
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

  // ——— Scroll choreography ———
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate:  (self) => { progressRef.current = self.progress; },
        onToggle:  (self) => { activeRef.current   = self.isActive; },
      });

      gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      })
        .fromTo(".spiral-title", { y: 38, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.12 }, 0.04)
        .set(".spiral-phase-0", { autoAlpha: 1 }, 0)
        .to(".spiral-phase-0",   { autoAlpha: 0.28, duration: 0.1 }, 0.28)
        .fromTo(".spiral-phase-1", { autoAlpha: 0.28 }, { autoAlpha: 1, duration: 0.1 }, 0.30)
        .to(".spiral-phase-1",   { autoAlpha: 0.28, duration: 0.1 }, 0.58)
        .fromTo(".spiral-phase-2", { autoAlpha: 0.28 }, { autoAlpha: 1, duration: 0.1 }, 0.62);
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      aria-label="The transformation: liquid milk spirals down and becomes premium powder"
      className={`relative ${reduced ? "" : "h-[250vh]"} bg-gradient-to-b from-deep-900 via-deep-800/70 to-cream`}
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">

        {/* Canvas fills the section as a visual backdrop */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {/* Text overlay */}
        <div className="relative z-10 flex w-full flex-col items-center px-5 text-center">
          <p className="kicker text-gold-light">The Transformation</p>
          <h2 className="spiral-title mt-4 font-serif text-4xl leading-tight text-milk opacity-0 sm:text-5xl lg:text-6xl">
            Liquid milk becomes<br className="hidden sm:block" /> premium powder
          </h2>

          <div className="mt-12 flex flex-wrap justify-center gap-10 sm:gap-16">
            {PHASES.map((ph, i) => (
              <div
                key={ph.label}
                className={`spiral-phase-${i} text-center`}
                style={{ opacity: i === 0 ? 1 : 0.28 }}
              >
                <p className="text-xs uppercase tracking-kicker text-gold">{ph.num}</p>
                <p className="mt-2 font-serif text-lg text-milk sm:text-xl">{ph.label}</p>
                <p className="mt-1 hidden text-sm text-deep-100/55 sm:block">{ph.sub}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
