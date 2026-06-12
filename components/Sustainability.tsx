"use client";

import { motion, useReducedMotion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

type Illustration = { paths: string[]; circle?: { cx: number; cy: number; r: number } };

const PILLARS: { title: string; text: string; art: Illustration }[] = [
  {
    title: "Responsible Sourcing",
    text: "Long-term partnerships with audited family and cooperative farms that meet strict animal-welfare and land-management standards.",
    art: {
      // sprouting leaf
      paths: [
        "M40 62 V36",
        "M40 40 C40 26 30 20 18 20 C18 34 28 40 40 40",
        "M40 34 C40 22 50 16 62 16 C62 30 52 36 40 36",
      ],
    },
  },
  {
    title: "Efficient Processing",
    text: "Heat-recovery evaporators and modern spray-drying lines cut energy use per tonne of powder year after year.",
    art: {
      // lightning bolt in a droplet
      paths: ["M40 10 C52 28 60 38 60 50 A20 20 0 1 1 20 50 C20 38 28 28 40 10 Z", "M42 34 L34 50 H42 L38 64 L50 46 H42 L46 34 Z"],
    },
  },
  {
    title: "Reduced Waste",
    text: "Whey streams are captured and refined into ingredients rather than discarded — almost nothing leaves the plant unused.",
    art: {
      // circular arrows
      paths: [
        "M58 30 A22 22 0 0 0 22 30",
        "M22 50 A22 22 0 0 0 58 50",
        "M58 30 l2 -10 M58 30 l-10 -2",
        "M22 50 l-2 10 M22 50 l10 2",
      ],
    },
  },
  {
    title: "Sustainable Production",
    text: "Water recirculation, recyclable kraft packaging and optimised logistics shrink the footprint of every shipment.",
    art: {
      // sun over field
      paths: ["M12 58 H68", "M24 58 Q40 44 56 58", "M40 12 v8 M20 20 l6 6 M60 20 l-6 6 M12 36 h8 M60 36 h8"],
      circle: { cx: 40, cy: 36, r: 10 },
    },
  },
];

/**
 * Sustainability — four pillars, each illustrated with a line drawing
 * that draws itself when scrolled into view.
 */
export default function Sustainability() {
  const reduced = useReducedMotion();

  return (
    <section id="sustainability" className="bg-milk py-28 sm:py-36">
      <div className="container-site">
        <SectionHeading
          kicker="Sustainability"
          title="Premium today. Responsible for tomorrow."
          lede="Quality dairy can only come from healthy land, healthy herds and efficient plants — so we protect all three."
        />

        <div className="mt-16 grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.08}>
              <div className="group h-full rounded-3xl border border-silver/50 bg-gradient-to-b from-cream/60 to-white p-8 transition-all duration-500 ease-luxe hover:-translate-y-2 hover:shadow-xl hover:shadow-deep/10">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-deep/5 transition-colors duration-500 group-hover:bg-deep/10">
                  <svg viewBox="0 0 80 80" className="h-14 w-14" aria-hidden="true">
                    {pillar.art.circle && (
                      <motion.circle
                        cx={pillar.art.circle.cx}
                        cy={pillar.art.circle.cy}
                        r={pillar.art.circle.r}
                        fill="none"
                        stroke="#C9A96A"
                        strokeWidth="3"
                        initial={reduced ? false : { pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }}
                      />
                    )}
                    {pillar.art.paths.map((d, j) => (
                      <motion.path
                        key={j}
                        d={d}
                        fill="none"
                        stroke="#0A2E52"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={reduced ? false : { pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 1.2, delay: 0.2 + j * 0.25, ease: "easeInOut" }}
                      />
                    ))}
                  </svg>
                </div>
                <h3 className="mt-6 font-serif text-xl text-deep-900">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-deep-900/65">{pillar.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
