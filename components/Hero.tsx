"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Hero — wordmark, one-line positioning, ambient milk swirl (pure CSS
 * rotation, disabled under reduced motion) and the scroll affordance.
 */
export default function Hero() {
  return (
    <section
      id="top"
      aria-label="Belalak — Belarusian milk powder"
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-milk px-5 pt-[var(--nav-height)]"
    >
      {/* ambient milk swirl */}
      <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
        <svg
          viewBox="0 0 600 600"
          className="h-[88vmin] w-[88vmin] opacity-70"
          fill="none"
        >
          <defs>
            <radialGradient id="hero-pool" cx="50%" cy="50%" r="50%">
              <stop offset="0%" className="stop-milk" />
              <stop offset="72%" className="stop-ivory" stopOpacity="0.55" />
              <stop offset="100%" className="stop-ivory" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="300" cy="300" r="290" fill="url(#hero-pool)" />
          <g className="swirl" stroke="rgb(var(--c-steel))" strokeOpacity="0.14">
            <ellipse cx="300" cy="300" rx="252" ry="238" strokeWidth="1.5" transform="rotate(8 300 300)" />
            <ellipse cx="300" cy="300" rx="196" ry="212" strokeWidth="1.2" transform="rotate(-14 300 300)" />
            <path d="M300 96c118 0 204 92 204 204" strokeWidth="2" strokeLinecap="round" stroke="rgb(var(--c-cream))" strokeOpacity="0.45" />
          </g>
          <g className="swirl-reverse" stroke="rgb(var(--c-steel))" strokeOpacity="0.1">
            <ellipse cx="300" cy="300" rx="150" ry="138" strokeWidth="1.4" transform="rotate(24 300 300)" />
            <ellipse cx="300" cy="300" rx="104" ry="116" strokeWidth="1.1" transform="rotate(-30 300 300)" />
            <path d="M132 300c0-93 75-168 168-168" strokeWidth="1.8" strokeLinecap="round" stroke="rgb(var(--c-cream))" strokeOpacity="0.35" />
          </g>
          <circle cx="300" cy="300" r="58" fill="rgb(var(--c-ivory))" fillOpacity="0.5" />
        </svg>
      </div>

      <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="kicker"
        >
          Belarusian dairy · B2B ingredient supply
        </motion.p>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="mt-4 font-display text-[17vw] font-extrabold leading-none tracking-tight text-ink sm:text-7xl md:text-8xl"
        >
          BELALAK
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.55, delay: 0.28 }}
          className="mt-5 max-w-xl text-balance text-lg leading-relaxed text-steel"
        >
          Belarusian milk powder, from farm to spray drier. Skim or whole,
          regular or instantized — follow the production line and configure
          the exact powder you need.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <a href="#journey" className="btn-primary">
            Follow the milk
          </a>
          <a href="#contact" className="btn-ghost">
            Request a quote
          </a>
        </motion.div>

        <motion.ul
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {["SMP · WMP", "REGULAR · INSTANT", "25 KG EXPORT BAGS"].map((t) => (
            <li key={t} className="readout">
              {t}
            </li>
          ))}
        </motion.ul>
      </div>

      {/* scroll affordance */}
      <div
        aria-hidden="true"
        className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="readout !text-[0.6rem] uppercase tracking-kicker">
          Scroll to follow the milk
        </span>
        <span className="relative h-10 w-px overflow-hidden bg-steel/25">
          <span className="hint-bead absolute left-1/2 top-0 h-3 w-[3px] -translate-x-1/2 rounded-full bg-cream" />
        </span>
        <span className="font-mono text-xs text-steel">↓</span>
      </div>
    </section>
  );
}
