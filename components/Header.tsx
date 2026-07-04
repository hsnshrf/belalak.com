"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { STAGES } from "@/lib/stages";

/**
 * Sticky minimal header with the production-line progress indicator:
 * a tiny pipeline diagram (9 nodes) that fills as the visitor scrolls
 * the journey. Nodes are anchor links to their stages.
 */
export default function Header() {
  const fillRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let last = -2;
    // Which stage is on screen. Pinned sections are position-fixed inside a
    // pin-spacer, so IntersectionObserver mis-tracks them — instead compare
    // the viewport center against each stage's pin-spacer bounds.
    const updateActive = () => {
      const centerY = window.innerHeight / 2;
      let current = -1;
      for (let i = 0; i < STAGES.length; i++) {
        const el = document.getElementById(STAGES[i].id);
        if (!el) continue;
        const box = el.parentElement?.classList.contains("pin-spacer")
          ? el.parentElement
          : el;
        const rect = box.getBoundingClientRect();
        if (rect.top <= centerY && rect.bottom >= centerY) {
          current = i;
          break;
        }
      }
      if (current !== last) {
        last = current;
        setActive(current);
      }
    };

    // Progress across the whole journey wrapper (pin spacers included).
    // This is informational scroll feedback, not decorative motion, so it
    // also runs under prefers-reduced-motion.
    const st = ScrollTrigger.create({
      trigger: "#journey",
      start: "top 75%",
      end: "bottom bottom",
      onUpdate: (self) => {
        const scale = `scaleX(${self.progress.toFixed(4)})`;
        if (fillRef.current) fillRef.current.style.transform = scale;
        if (barRef.current) barRef.current.style.transform = scale;
      },
    });

    // rAF-throttled scroll listener for the active-stage readout.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updateActive();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    updateActive();

    return () => {
      st.kill();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[var(--nav-height)] border-b border-steel/15 bg-milk/90 backdrop-blur">
      <a
        href="#journey"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-steel-deep focus:px-3 focus:py-1 focus:text-milk"
      >
        Skip to the production journey
      </a>
      <div className="container-site flex h-full items-center justify-between gap-6">
        <a
          href="#top"
          className="font-display text-lg font-extrabold tracking-tight text-ink"
        >
          BELALAK
          <span className="ml-2 hidden font-mono text-[0.6rem] font-normal tracking-kicker text-steel sm:inline">
            MILK POWDER · BELARUS
          </span>
        </a>

        {/* Pipeline progress diagram (desktop) */}
        <nav
          aria-label="Production line progress"
          className="relative hidden h-8 flex-1 max-w-md items-center md:flex lg:max-w-lg"
        >
          <div className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-steel/25" />
          <div
            ref={fillRef}
            className="absolute inset-x-1 top-1/2 h-[2px] origin-left -translate-y-1/2 scale-x-0 bg-cream"
          />
          {STAGES.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              title={`${s.num} — ${s.title}`}
              aria-label={`Stage ${s.num}: ${s.title}`}
              aria-current={i === active ? "step" : undefined}
              className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5"
              style={{ left: `${4 + (i / (STAGES.length - 1)) * 92}%` }}
            >
              <span
                className={`block h-2 w-2 rounded-full border transition-all duration-200 ${
                  i === active
                    ? "scale-150 border-cream bg-cream"
                    : i < active
                      ? "border-steel bg-steel"
                      : "border-steel/40 bg-milk group-hover:border-steel"
                }`}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="readout hidden lg:inline" aria-hidden="true">
            {active >= 0 ? `${STAGES[active].num} ${STAGES[active].short.toUpperCase()}` : "00 START"}
          </span>
          <a href="#contact" className="btn-primary !px-4 !py-2 text-xs">
            Request a quote
          </a>
        </div>
      </div>

      {/* Slim progress bar (mobile) */}
      <div
        ref={barRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-cream md:hidden"
      />
    </header>
  );
}
