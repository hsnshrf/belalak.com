"use client";

import { useEffect, useState } from "react";
import { useJourneyState } from "@/lib/journeyState";

/**
 * Screen-reader announcements for the two decision points. A single
 * polite live region so choices (and applied defaults) are spoken
 * without stealing focus.
 */
export default function Announcer() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    return useJourneyState.subscribe((state, prev) => {
      if (state.fat !== prev.fat && state.fat) {
        const suffix = state.fatDefaulted
          ? " (default applied — you can change it anytime)"
          : "";
        setMessage(
          state.fat === "skim"
            ? `Skim milk path selected${suffix}. Cream is diverted to butter and cream production; the line now shows skim milk.`
            : `Whole milk path selected${suffix}. Milk keeps its natural fat; the line now shows whole milk.`
        );
      } else if (state.texture !== prev.texture && state.texture) {
        const suffix = state.textureDefaulted
          ? " (default applied — you can change it anytime)"
          : "";
        setMessage(
          state.texture === "instant"
            ? `Instantized powder selected${suffix}. Lecithin is dosed and particles are agglomerated for instant dispersion.`
            : `Regular powder selected${suffix}. Nothing is added — pure single-ingredient milk powder.`
        );
      }
    });
  }, []);

  return (
    <div aria-live="polite" role="status" className="sr-only">
      {message}
    </div>
  );
}
