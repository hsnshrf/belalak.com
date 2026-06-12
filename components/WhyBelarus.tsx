"use client";

import { motion, useReducedMotion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import Counter from "@/components/ui/Counter";

const FARM_DOTS = [
  { x: 175, y: 215 }, { x: 240, y: 150 }, { x: 320, y: 130 }, { x: 410, y: 160 },
  { x: 455, y: 230 }, { x: 420, y: 300 }, { x: 340, y: 330 }, { x: 250, y: 310 },
  { x: 190, y: 280 }, { x: 360, y: 240 },
];

const CITIES = [
  { x: 140, y: 330, name: "Brest" },
  { x: 122, y: 175, name: "Grodno" },
  { x: 425, y: 105, name: "Vitebsk" },
  { x: 462, y: 318, name: "Gomel" },
];

const STATS = [
  { value: 7.8, decimals: 1, suffix: "M", label: "Tonnes of raw milk produced annually" },
  { value: 60, suffix: "%", label: "Of dairy output destined for export" },
  { value: 100, suffix: "+", label: "Export markets served worldwide" },
  { value: 5, prefix: "Top ", label: "Among the world's leading dairy exporters" },
];

const REASONS = [
  "One of the world's leading dairy-producing nations",
  "Modern, large-scale dairy processing infrastructure",
  "Strict state-supervised quality controls at every step",
  "Export-oriented production built for global logistics",
  "Abundant, consistent, high-quality raw milk supply",
];

/**
 * Why Belarus — a stylised animated map of the country with its dairy
 * farm network radiating from Minsk, alongside animated statistics.
 */
export default function WhyBelarus() {
  const reduced = useReducedMotion();

  return (
    <section id="belarus" className="grain relative bg-deep-950 py-28 sm:py-36">
      <div className="container-site">
        <SectionHeading
          kicker="Why Belarus"
          title="A nation built on dairy"
          lede="The Republic of Belarus is one of the most renowned dairy-producing countries on earth — and the source of every Belalak product."
          tone="dark"
        />

        <div className="mt-16 grid items-center gap-14 lg:grid-cols-2">
          {/* stylised map */}
          <Reveal>
            <div className="relative">
              <svg viewBox="0 0 600 440" className="w-full" role="img" aria-label="Stylised map of Belarus showing its dairy farm network around Minsk">
                <defs>
                  <radialGradient id="by-glow" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#2D659F" stopOpacity="0.45" />
                    <stop offset="1" stopColor="#2D659F" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <circle cx="300" cy="220" r="210" fill="url(#by-glow)" />

                {/* country silhouette (stylised) */}
                <motion.path
                  d="M120 150 Q150 90 230 80 Q300 60 360 85 Q430 70 480 110 Q540 140 520 200 Q545 260 500 300 Q510 350 450 370 Q380 400 310 380 Q240 400 180 370 Q110 350 100 290 Q70 240 95 200 Q90 170 120 150 Z"
                  fill="#0A2E52"
                  stroke="#4F86C0"
                  strokeWidth="2"
                  initial={reduced ? false : { pathLength: 0, fillOpacity: 0 }}
                  whileInView={{ pathLength: 1, fillOpacity: 0.55 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />

                {/* farm-to-capital network */}
                {FARM_DOTS.map((dot, i) => (
                  <motion.g
                    key={i}
                    initial={reduced ? false : { opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <line x1={dot.x} y1={dot.y} x2="300" y2="220" stroke="#4F86C0" strokeWidth="1" opacity="0.3" />
                    <circle cx={dot.x} cy={dot.y} r="5" fill="#C9A96A" />
                  </motion.g>
                ))}

                {/* regional cities */}
                {CITIES.map((city) => (
                  <g key={city.name}>
                    <circle cx={city.x} cy={city.y} r="3.5" fill="#7FA8D3" />
                    <text x={city.x + 10} y={city.y + 4} fontSize="13" fill="#7FA8D3">
                      {city.name}
                    </text>
                  </g>
                ))}

                {/* Minsk */}
                <g>
                  <circle cx="300" cy="220" r="26" fill="#C9A96A" opacity="0.18" className="animate-ping-soft" style={{ transformOrigin: "300px 220px" }} />
                  <circle cx="300" cy="220" r="9" fill="#FFF7E8" stroke="#C9A96A" strokeWidth="3" />
                  <text x="300" y="200" textAnchor="middle" fontSize="15" fontWeight="600" letterSpacing="2" fill="#FFF7E8">
                    MINSK
                  </text>
                </g>
              </svg>
              <p className="mt-2 text-center text-xs text-deep-100/40">
                Stylised illustration — Belalak partner farm network
              </p>
            </div>
          </Reveal>

          {/* reasons + stats */}
          <div>
            <ul className="space-y-4">
              {REASONS.map((reason, i) => (
                <Reveal key={reason} delay={i * 0.07}>
                  <li className="flex items-start gap-4 text-deep-100/85">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs text-gold-light">
                      ✓
                    </span>
                    <span className="text-base sm:text-lg">{reason}</span>
                  </li>
                </Reveal>
              ))}
            </ul>

            <div className="mt-12 grid grid-cols-2 gap-6">
              {STATS.map((stat, i) => (
                <Reveal key={stat.label} delay={i * 0.08}>
                  <div className="rounded-2xl border border-deep-700/50 bg-deep-900/50 p-6">
                    <p className="font-serif text-4xl text-gold-light sm:text-5xl">
                      <Counter
                        to={stat.value}
                        decimals={stat.decimals ?? 0}
                        prefix={stat.prefix ?? ""}
                        suffix={stat.suffix ?? ""}
                      />
                    </p>
                    <p className="mt-2 text-sm leading-snug text-deep-100/60">{stat.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
