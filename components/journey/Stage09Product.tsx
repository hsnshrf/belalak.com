"use client";

import { resolveProductKey, useJourneyState } from "@/lib/journeyState";
import { useStagePin } from "@/lib/stageAnimation";
import { VARIANTS, type Variant } from "@/lib/variants";
import StageCopy from "./StageCopy";

/** Variant color band on the bag (SVG fill classes ↔ design tokens). */
const BAND_FILL: Record<Variant["key"], string> = {
  "smp-regular": "fill-steel",
  "smp-instant": "fill-pasture",
  "wmp-regular": "fill-cream",
  "wmp-instant": "fill-steel-deep",
};

/**
 * STAGE 09 — The final product.
 *
 * The journey resolves into one of FOUR outcomes (skim|whole ×
 * regular|instant) driven entirely by the two decisions in the store.
 * A 25 kg kraft bag with Belalak branding, the variant spec table and
 * the B2B CTA. Both choices remain changeable from here.
 */
export default function Stage09Product() {
  const fat = useJourneyState((s) => s.fat);
  const texture = useJourneyState((s) => s.texture);
  const fatDefaulted = useJourneyState((s) => s.fatDefaulted);
  const textureDefaulted = useJourneyState((s) => s.textureDefaulted);

  const variant = VARIANTS[resolveProductKey(fat, texture)];
  const anyDefaulted =
    (fatDefaulted && fat !== null) || (textureDefaulted && texture !== null);

  const ref = useStagePin({
    id: "stage-product",
    length: 1800,
    build: ({ tl, q }) => {
      tl.fromTo(q(".stage-copy"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, 0)
        .fromTo(
          q(".prod-bag"),
          { opacity: 0, y: 34, scale: 0.94, transformOrigin: "center bottom" },
          { opacity: 1, y: 0, scale: 1, duration: 0.7 },
          0.15
        )
        .fromTo(
          q(".prod-spec-row"),
          { opacity: 0, x: -12 },
          { opacity: 1, x: 0, duration: 0.18, stagger: 0.08 },
          0.5
        )
        .fromTo(q(".prod-cta"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35 }, "-=0.2");
    },
  });

  return (
    <section
      id="stage-product"
      ref={ref as React.RefObject<HTMLElement>}
      aria-labelledby="stage-product-title"
      className="relative overflow-hidden bg-ivory"
    >
      <div className="container-site flex min-h-svh flex-col gap-4 pb-6 pt-[calc(var(--nav-height)+1.25rem)] md:grid md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-4">
          <StageCopy
            id="stage-product"
            num="09"
            kicker="YOUR RESULT"
            title={variant.name}
          >
            <p>{variant.description}</p>
            {anyDefaulted && (
              <p className="readout !text-cream">
                A DEFAULT WAS APPLIED WHERE YOU SKIPPED A CHOICE — CHANGE IT
                BELOW.
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <a href="#stage-separation" className="readout rounded border border-steel/30 px-2 py-1 underline decoration-cream underline-offset-2 hover:border-steel">
                change: {variant.fat === "skim" ? "SKIM" : "WHOLE"} ↺
              </a>
              <a href="#stage-instantizing" className="readout rounded border border-steel/30 px-2 py-1 underline decoration-cream underline-offset-2 hover:border-steel">
                change: {variant.texture === "instant" ? "INSTANT" : "REGULAR"} ↺
              </a>
            </div>
            <div className="prod-cta flex flex-wrap gap-3 pt-3">
              <a href="#contact" className="btn-gold">
                Request a quote / sample
              </a>
              {variant.specSheet && (
                <a href={variant.specSheet} className="btn-ghost" download>
                  Spec sheet (PDF)
                </a>
              )}
            </div>
          </StageCopy>
        </div>

        {/* the bag */}
        <div className="min-h-0 flex-1 md:col-span-4">
          <svg
            viewBox="0 0 360 470"
            role="img"
            aria-label={`25 kilogram kraft paper bag of Belalak ${variant.name}`}
            className="prod-bag mx-auto h-full max-h-[46vh] w-auto md:max-h-[70vh]"
          >
            <defs>
              <linearGradient id="prod-kraft" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" className="stop-concentrate" />
                <stop offset="18%" className="stop-ivory" />
                <stop offset="70%" className="stop-ivory" />
                <stop offset="100%" className="stop-concentrate" />
              </linearGradient>
            </defs>
            {/* shadow */}
            <ellipse cx="180" cy="446" rx="120" ry="12" fill="rgb(var(--c-steel-deep))" opacity="0.12" />
            {/* bag body */}
            <rect x="62" y="40" width="236" height="400" rx="10" fill="url(#prod-kraft)" stroke="rgb(var(--c-steel))" strokeOpacity="0.3" strokeWidth="1.4" />
            {/* side gusset fold */}
            <rect x="62" y="40" width="22" height="400" rx="10" fill="rgb(var(--c-steel-deep))" opacity="0.07" />
            <line x1="84" y1="48" x2="84" y2="432" stroke="rgb(var(--c-steel))" strokeOpacity="0.25" strokeWidth="1" />
            {/* stitched top with crepe tape */}
            <rect x="58" y="34" width="244" height="18" rx="6" fill="rgb(var(--c-milk))" stroke="rgb(var(--c-steel))" strokeOpacity="0.3" strokeWidth="1.2" />
            <line x1="66" y1="43" x2="294" y2="43" stroke="rgb(var(--c-steel))" strokeOpacity="0.5" strokeWidth="1.4" strokeDasharray="4 5" />

            {/* print: wordmark + variant band + data block */}
            <text x="192" y="120" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="34" letterSpacing="2" fill="rgb(var(--c-steel-deep))">
              BELALAK
            </text>
            <text x="192" y="142" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="3" fill="rgb(var(--c-steel))">
              SPRAY-DRIED MILK POWDER
            </text>
            <rect x="86" y="166" width="212" height="34" rx="4" className={BAND_FILL[variant.key]} />
            <text x="192" y="187" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="13" letterSpacing="0.5" fill={variant.key === "wmp-regular" ? "rgb(var(--c-steel-deep))" : "rgb(var(--c-milk))"}>
              {variant.name.toUpperCase()}
            </text>
            <text x="192" y="222" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="rgb(var(--c-steel))">
              {variant.fat === "skim" ? "FAT ≤ 1.25 %" : "FAT 26–28 %"} ·{" "}
              {variant.texture === "instant" ? "INSTANT" : "REGULAR"}
            </text>

            {/* mock data block */}
            <g fontFamily="var(--font-mono)" fontSize="9.5" fill="rgb(var(--c-steel))">
              <text x="112" y="268">BATCH</text>
              <text x="248" y="268" textAnchor="end">— — — —</text>
              <text x="112" y="286">PROD DATE</text>
              <text x="248" y="286" textAnchor="end">— — / — —</text>
              <text x="112" y="304">ORIGIN</text>
              <text x="248" y="304" textAnchor="end">BELARUS</text>
              <line x1="112" y1="314" x2="248" y2="314" stroke="rgb(var(--c-steel))" strokeOpacity="0.3" />
              <text x="112" y="332">☂ KEEP DRY</text>
              <text x="248" y="332" textAnchor="end">&lt; 25 °C</text>
            </g>

            <text x="192" y="404" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="26" fill="rgb(var(--c-steel-deep))">
              25 kg
            </text>
            <text x="192" y="420" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="rgb(var(--c-steel))">
              NET · MULTIWALL KRAFT + PE LINER
            </text>
          </svg>
        </div>

        {/* spec table */}
        <div className="min-h-0 md:col-span-4">
          <h3 className="kicker mb-3">Typical specification</h3>
          <table className="w-full border-collapse font-mono text-xs sm:text-sm">
            <tbody>
              {variant.specs.map((spec) => (
                <tr key={spec.label} className="prod-spec-row border-b border-steel/15">
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-steel">
                    {spec.label}
                  </th>
                  <td className="py-2 text-right font-medium text-ink">{spec.value}</td>
                </tr>
              ))}
              <tr className="prod-spec-row">
                <th scope="row" className="py-2 pr-3 text-left font-normal text-steel">
                  Applications
                </th>
                <td className="py-2 text-right text-ink">
                  {variant.applications.join(" · ")}
                </td>
              </tr>
            </tbody>
          </table>
          {/* OWNER: verify all spec values against your plant's COA. */}
          <p className="readout mt-3 !text-[0.65rem] text-steel/70">
            Typical values — final certificate of analysis accompanies every
            shipment.
          </p>
        </div>
      </div>
    </section>
  );
}
