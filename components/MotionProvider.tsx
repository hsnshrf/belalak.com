"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Makes every Framer Motion micro-interaction respect the visitor's
 * prefers-reduced-motion setting (GSAP choreography is handled separately
 * via gsap.matchMedia in lib/stageAnimation.ts).
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
