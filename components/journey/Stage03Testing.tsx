"use client";

import { counterTween, drawTween, useStagePin } from "@/lib/stageAnimation";
import StageCopy from "./StageCopy";

/**
 * STAGE 03 — Milk reception & quality testing.
 *
 * The trust-signal stage: ten lab readouts appear one by one, each value
 * counting to its result before a PASS stamp lands. Only after all ten
 * pass does the reception valve rotate open and milk flow into the plant.
 *
 * Values are typical for premium raw milk; limits shown are common trade
 * requirements. OWNER: verify against your intake specification.
 */
type LabTest = {
  label: string;
  /** numeric result (counted up by the timeline) … */
  target?: number;
  from?: number;
  decimals?: number;
  suffix?: string;
  /** … or a verbal result */
  text?: string;
  note: string;
};

const TESTS: LabTest[] = [
  { label: "Temperature", target: 3.8, decimals: 1, suffix: " °C", note: "limit ≤ 4.0 °C" },
  { label: "Organoleptic", text: "CLEAN · FRESH", note: "appearance & odor" },
  { label: "Fat", target: 3.6, decimals: 1, suffix: " %", note: "basis for standardization" },
  { label: "Protein", target: 3.2, decimals: 1, suffix: " %", note: "true protein" },
  { label: "Density", target: 1.029, from: 1.0, decimals: 3, suffix: " g/cm³", note: "total solids 12.5 %" },
  { label: "Acidity", target: 16.5, decimals: 1, suffix: " °T", note: "pH 6.7" },
  { label: "Somatic cells", target: 180, suffix: " ×10³/ml", note: "limit < 400" },
  { label: "Bacterial count", target: 45, suffix: " ×10³ CFU/ml", note: "limit < 100" },
  { label: "Antibiotic residues", text: "NEGATIVE", note: "rapid inhibitor test" },
  { label: "Added water", target: -0.522, decimals: 3, suffix: " °C", note: "freezing point — none detected" },
];

export default function Stage03Testing() {
  const ref = useStagePin({
    id: "stage-testing",
    length: 3200,
    build: ({ tl, q }) => {
      tl.fromTo(q(".stage-copy"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4 }, 0);

      // Each test: card slides in → value counts → PASS stamps down.
      const cards = q(".lab-card");
      cards.forEach((card) => {
        const value = card.querySelector(".lab-value") as HTMLElement | null;
        const pass = card.querySelector(".lab-pass");
        tl.fromTo(card, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.16 }, "+=0.04");
        if (value?.dataset.target) {
          tl.add(
            counterTween(value, {
              from: Number(value.dataset.from ?? 0),
              to: Number(value.dataset.target),
              decimals: Number(value.dataset.decimals ?? 0),
              suffix: value.dataset.suffix ?? "",
              duration: 0.3,
            }),
            "-=0.05"
          );
        } else if (value) {
          tl.fromTo(value, { opacity: 0 }, { opacity: 1, duration: 0.2 }, "-=0.05");
        }
        if (pass) {
          tl.fromTo(
            pass,
            { opacity: 0, scale: 1.7, rotation: -14, transformOrigin: "center" },
            { opacity: 1, scale: 1, rotation: -6, duration: 0.14, ease: "back.out(2)" }
          );
        }
      });

      // All passed → banner, valve opens, milk released into the plant.
      tl.fromTo(q(".lab-banner"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, "+=0.1");
      tl.fromTo(
        q(".lab-valve-handle"),
        { rotation: -90, transformOrigin: "center" },
        { rotation: 0, duration: 0.35 }
      );
      const milk = q(".lab-milk")[0];
      if (milk) tl.add(drawTween(milk, { duration: 0.6 }), "-=0.1");
      tl.fromTo(q(".lab-released"), { opacity: 0 }, { opacity: 1, duration: 0.25 }, "-=0.2");
    },
  });

  return (
    <section
      id="stage-testing"
      ref={ref as React.RefObject<HTMLElement>}
      aria-labelledby="stage-testing-title"
      className="relative overflow-hidden bg-ivory"
    >
      <div className="container-site flex min-h-svh flex-col gap-4 pb-6 pt-[calc(var(--nav-height)+1.25rem)] md:grid md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-4">
          <StageCopy
            id="stage-testing"
            num="03"
            kicker="RECEPTION LAB"
            title="Ten checks before a single litre enters"
          >
            <p>
              Every tanker is sampled at the reception bay and tested before
              unloading. Milk that fails any parameter is rejected — only
              compliant milk enters production.
            </p>
            <p className="hidden sm:block">
              The intake valve stays closed until the lab releases the load.
            </p>
          </StageCopy>
        </div>

        <div className="min-h-0 flex-1 md:col-span-8">
          <ol className="grid grid-cols-2 gap-2 sm:gap-2.5" aria-label="Raw milk acceptance tests">
            {TESTS.map((test) => (
              <li
                key={test.label}
                className="lab-card relative rounded-lg border border-steel/20 bg-milk px-3 py-2"
              >
                <p className="font-mono text-[0.6rem] uppercase tracking-wider text-steel">
                  {test.label}
                </p>
                {test.text ? (
                  <p className="lab-value mt-0.5 font-mono text-sm font-medium text-ink">
                    {test.text}
                  </p>
                ) : (
                  <p
                    className="lab-value mt-0.5 font-mono text-sm font-medium text-ink"
                    data-target={test.target}
                    data-from={test.from ?? 0}
                    data-decimals={test.decimals ?? 0}
                    data-suffix={test.suffix ?? ""}
                  >
                    {test.target?.toFixed(test.decimals ?? 0)}
                    {test.suffix}
                  </p>
                )}
                <p className="font-mono text-[0.6rem] text-steel/70">{test.note}</p>
                <span
                  className="lab-pass absolute right-2 top-2 -rotate-6 rounded border-2 border-pasture px-1 py-px font-mono text-[0.6rem] font-bold text-pasture"
                  aria-label="passed"
                >
                  PASS
                </span>
              </li>
            ))}
          </ol>

          {/* the intake valve — closed until the lab releases the load */}
          <div className="mt-3 flex items-center gap-3">
            <svg
              viewBox="0 0 560 72"
              role="img"
              aria-label="Reception intake pipe with its valve open after all tests passed — milk released to production"
              className="h-14 w-full max-w-xl"
            >
              <defs>
                <linearGradient id="lab-pipe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className="stop-steel-hi" />
                  <stop offset="100%" className="stop-steel-lo" />
                </linearGradient>
              </defs>
              {/* pipe */}
              <rect x="0" y="26" width="560" height="20" rx="5" fill="url(#lab-pipe)" opacity="0.9" />
              <rect x="4" y="30" width="552" height="12" rx="3" fill="rgb(var(--c-steel-deep))" opacity="0.25" />
              <path className="lab-milk" d="M0,36 L560,36" fill="none" stroke="var(--m-milk-raw)" strokeWidth="10" />
              {/* butterfly valve */}
              <circle cx="150" cy="36" r="17" fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="1.5" />
              <circle cx="150" cy="36" r="7" fill="var(--m-steel-hi)" />
              {/* handle authored OPEN (parallel to pipe — final state); the
                  timeline rotates it from -90° (closed) to 0° */}
              <g className="lab-valve-handle">
                <rect x="136" y="33.5" width="28" height="5" rx="2.5" fill="rgb(var(--c-cream))" stroke="var(--m-steel-edge)" strokeWidth="0.8" />
              </g>
              <text className="lab-released" x="330" y="18" fontFamily="var(--font-mono)" fontSize="11" fill="rgb(var(--c-pasture))" fontWeight="600">
                ✓ RELEASED TO PRODUCTION
              </text>
            </svg>
          </div>

          <p className="lab-banner readout mt-1 !text-pasture">
            10 / 10 PARAMETERS PASSED — LOAD ACCEPTED
          </p>
        </div>
      </div>
    </section>
  );
}
