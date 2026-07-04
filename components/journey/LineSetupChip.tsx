"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useJourneyState } from "@/lib/journeyState";

/**
 * Floating “change my choice” control. Appears once the visitor has passed
 * decision point #1 and stays accessible for the rest of the page, so both
 * branch choices can be revisited at any time.
 */
export default function LineSetupChip() {
  const { fat, texture } = useJourneyState();

  return (
    <AnimatePresence>
      {fat !== null && (
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          aria-label="Your production line setup"
          className="fixed bottom-4 left-4 z-40 rounded-xl border border-steel/20 bg-milk/95 p-3 shadow-lg shadow-steel-deep/10 backdrop-blur print:hidden"
        >
          <p className="readout mb-2 !text-[0.6rem] uppercase tracking-kicker">
            Your line setup
          </p>
          <dl className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center gap-2">
              <dt className="w-14 text-steel">Milk</dt>
              <dd className="font-medium text-ink">
                {fat === "skim" ? "Skim" : "Whole"}
              </dd>
              <a
                href="#stage-separation"
                className="ml-auto rounded px-1.5 py-0.5 text-[0.65rem] text-steel underline decoration-cream underline-offset-2 hover:text-ink"
              >
                change
              </a>
            </div>
            <div className="flex items-center gap-2">
              <dt className="w-14 text-steel">Powder</dt>
              <dd className="font-medium text-ink">
                {texture === null
                  ? "—"
                  : texture === "instant"
                    ? "Instant"
                    : "Regular"}
              </dd>
              <a
                href="#stage-instantizing"
                className="ml-auto rounded px-1.5 py-0.5 text-[0.65rem] text-steel underline decoration-cream underline-offset-2 hover:text-ink"
              >
                change
              </a>
            </div>
          </dl>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
