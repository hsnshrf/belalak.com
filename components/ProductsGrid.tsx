"use client";

import { useJourneyState } from "@/lib/journeyState";
import { VARIANT_LIST, type Variant } from "@/lib/variants";
import Reveal from "./Reveal";

const BAND_BG: Record<Variant["key"], string> = {
  "smp-regular": "bg-steel",
  "smp-instant": "bg-pasture",
  "wmp-regular": "bg-cream",
  "wmp-instant": "bg-steel-deep",
};

/**
 * The four powder variants (the four possible journey outcomes) plus a
 * note on related dairy ingredients. "View on the line" sets both branch
 * choices in the store and jumps to stage 09, so the grid and the journey
 * stay one system.
 */
export default function ProductsGrid() {
  const setFat = useJourneyState((s) => s.setFat);
  const setTexture = useJourneyState((s) => s.setTexture);

  const pick = (variant: Variant) => {
    setFat(variant.fat);
    setTexture(variant.texture);
  };

  return (
    <section id="products" aria-labelledby="products-title" className="bg-ivory py-20 sm:py-28">
      <div className="container-site">
        <Reveal>
          <p className="kicker">Product range</p>
          <h2 id="products-title" className="stage-title mt-3">
            Four powders, one line
          </h2>
          <p className="mt-4 max-w-2xl text-steel">
            Every variant is a combination of the two decisions you saw on
            the journey. All are packed in 25 kg multiwall kraft bags with a
            PE liner and shipped worldwide.
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VARIANT_LIST.map((variant, i) => (
            <Reveal key={variant.key} delay={i * 0.06} className="h-full">
              <li className="flex h-full flex-col rounded-xl border border-steel/15 bg-milk p-5">
                <span aria-hidden className={`h-1.5 w-12 rounded-full ${BAND_BG[variant.key]}`} />
                <h3 className="mt-3 font-display text-lg font-bold leading-tight text-ink">
                  {variant.name}
                </h3>
                <p className="readout mt-1">{variant.shortName.toUpperCase()}</p>
                <p className="mt-3 text-sm leading-snug text-steel">{variant.tagline}</p>
                <dl className="mt-4 space-y-1 font-mono text-xs">
                  {variant.specs.slice(0, 3).map((spec) => (
                    <div key={spec.label} className="flex justify-between gap-2">
                      <dt className="text-steel">{spec.label}</dt>
                      <dd className="font-medium text-ink">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <a
                    href="#stage-product"
                    onClick={() => pick(variant)}
                    className="readout rounded border border-steel/30 px-2 py-1 underline decoration-cream underline-offset-2 hover:border-steel"
                  >
                    VIEW ON THE LINE →
                  </a>
                  {variant.specSheet && (
                    <a href={variant.specSheet} download className="readout rounded border border-steel/30 px-2 py-1 hover:border-steel">
                      PDF
                    </a>
                  )}
                </div>
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.1}>
          <p className="mt-8 rounded-lg border border-steel/15 bg-milk/70 p-4 text-sm text-steel">
            Belalak also supplies related dairy ingredients on request —
            sweet whey powder, fat-filled milk powders and butter.{" "}
            <a href="#contact" className="underline decoration-cream underline-offset-2 hover:text-ink">
              Ask for the full ingredient list
            </a>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}
