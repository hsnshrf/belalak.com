"use client";

import { motion } from "framer-motion";

export type Choice<T extends string> = {
  value: T;
  title: string;
  body: string;
  /** small mono tag, e.g. "→ SMP" */
  tag: string;
};

/**
 * The interactive decision cards used at both branch points. Plain buttons
 * with aria-pressed (fully keyboard operable); selection is announced via
 * the shared live region in <Announcer/>.
 */
export default function ChoiceCards<T extends string>({
  label,
  choices,
  value,
  onChoose,
}: {
  label: string;
  choices: [Choice<T>, Choice<T>];
  value: T | null;
  onChoose: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="grid gap-3 sm:grid-cols-2">
      {choices.map((choice) => {
        const selected = value === choice.value;
        return (
          <motion.button
            key={choice.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChoose(choice.value)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            className={`rounded-xl border-2 p-4 text-left transition-colors duration-200 sm:p-5 ${
              selected
                ? "border-cream bg-ivory shadow-md shadow-cream/20"
                : "border-steel/25 bg-milk hover:border-steel/60"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-display text-base font-bold leading-tight text-ink sm:text-lg">
                {choice.title}
              </span>
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[0.6rem] font-bold ${
                  selected
                    ? "border-cream bg-cream text-steel-deep"
                    : "border-steel/40 text-transparent"
                }`}
              >
                ✓
              </span>
            </span>
            <span className="mt-2 block text-sm leading-snug text-steel">
              {choice.body}
            </span>
            <span className="readout mt-3 block !text-[0.65rem] text-cream">
              {choice.tag}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
