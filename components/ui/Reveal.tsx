"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type RevealProps = {
  children: ReactNode;
  /** Seconds to wait once in view — used to stagger sibling reveals. */
  delay?: number;
  y?: number;
  className?: string;
};

/** Fade-and-rise entrance used for headings, copy and cards site-wide. */
export default function Reveal({ children, delay = 0, y = 36, className }: RevealProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
