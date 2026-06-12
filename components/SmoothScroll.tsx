"use client";

import { type ReactNode, useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Wires Lenis smooth scrolling into GSAP's ticker so every ScrollTrigger
 * timeline reads the smoothed scroll position. Anchor links (#products…)
 * are handled by Lenis with an offset for the fixed navbar.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Reduced-motion users get instant native scrolling.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      anchors: { offset: -72 },
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
