"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const STEPS = [
  {
    title: "Milk Collection",
    detail:
      "Chilled tankers collect fresh milk daily from audited partner farms. Temperature and traceability data follow every litre from the farm gate.",
  },
  {
    title: "Laboratory Testing",
    detail:
      "Composition, microbiology, antibiotics and somatic cell counts are verified in accredited laboratories before a single litre enters production.",
  },
  {
    title: "Production",
    detail:
      "Closed, automated lines pasteurize, concentrate and spray-dry the milk under continuous HACCP monitoring with in-line CIP sanitation.",
  },
  {
    title: "Packaging",
    detail:
      "Powder is packed in multi-wall kraft bags with food-grade PE liners in positive-pressure rooms, then batch-coded for full traceability.",
  },
  {
    title: "Export",
    detail:
      "Every consignment ships with certificates of analysis, health certificates and full export documentation for seamless customs clearance.",
  },
];

const CERTS = [
  { code: "ISO", name: "ISO 22000", note: "Food safety management" },
  { code: "HACCP", name: "HACCP", note: "Hazard analysis & control" },
  { code: "HALAL", name: "Halal", note: "Certified production" },
  { code: "EAC", name: "GOST / EAC", note: "Eurasian conformity" },
];

/**
 * Quality & certifications — an interactive five-step timeline (click a
 * step to inspect it) plus animated certification badges.
 */
export default function Quality() {
  const [active, setActive] = useState(0);

  return (
    <section id="quality" className="bg-cream py-28 sm:py-36">
      <div className="container-site">
        <SectionHeading
          kicker="Quality & Certifications"
          title="Controlled from farm gate to port"
          lede="Five checkpoints guard every batch. Select a step to see what happens there."
        />

        {/* interactive timeline */}
        <div className="mt-16">
          <Reveal>
            <div className="relative">
              {/* track */}
              <div className="absolute left-0 right-0 top-5 hidden h-0.5 bg-silver sm:block" aria-hidden="true">
                <motion.div
                  className="h-full origin-left bg-gold"
                  animate={{ scaleX: (active + 1) / STEPS.length }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <ol className="relative grid gap-4 sm:grid-cols-5 sm:gap-0">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="sm:text-center">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-pressed={active === i}
                      className="group flex w-full items-center gap-4 sm:flex-col sm:gap-3"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                          i <= active
                            ? "border-gold bg-deep text-cream"
                            : "border-silver bg-white text-deep-900/40 group-hover:border-gold/60"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`text-sm font-semibold transition-colors ${
                          i === active ? "text-deep-900" : "text-deep-900/50 group-hover:text-deep-900/80"
                        }`}
                      >
                        {step.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          {/* active step detail */}
          <div className="mx-auto mt-10 max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-silver/60 bg-white p-7 text-center shadow-sm"
              >
                <p className="kicker text-gold-dark">
                  Checkpoint {active + 1} of {STEPS.length}
                </p>
                <p className="mt-3 text-base leading-relaxed text-deep-900/75 sm:text-lg">
                  {STEPS[active].detail}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* certification badges */}
        <div className="mt-20">
          <Reveal>
            <p className="text-center text-sm font-medium uppercase tracking-kicker text-deep-900/50">
              Certifications
            </p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {CERTS.map((cert, i) => (
              <Reveal key={cert.code} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6, rotate: -2 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center rounded-2xl border border-silver/60 bg-white p-6 text-center shadow-sm"
                >
                  {/* badge emblem */}
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full animate-spin-slow" aria-hidden="true">
                      <circle cx="40" cy="40" r="37" fill="none" stroke="#C9A96A" strokeWidth="1.5" strokeDasharray="4 6" />
                    </svg>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-deep text-[0.6rem] font-bold tracking-wider text-cream">
                      {cert.code}
                    </div>
                  </div>
                  <p className="mt-4 font-serif text-lg text-deep-900">{cert.name}</p>
                  <p className="mt-1 text-xs text-deep-900/50">{cert.note}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="mt-6 text-center text-xs text-deep-900/40">
              Certification artwork shown as placeholders — official certificates available on request.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
