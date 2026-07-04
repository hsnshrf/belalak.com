"use client";

import { useEffect, useLayoutEffect, useState } from "react";

/**
 * Tracks `prefers-reduced-motion` so heavy scroll choreography can be
 * replaced with a static (but complete) layout.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * useLayoutEffect that is safe under Next.js SSR (falls back to useEffect
 * on the server so React doesn't warn). GSAP setup wants layout timing.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
