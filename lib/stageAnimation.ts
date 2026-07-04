"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks";

/* ---------------------------------------------------------------------------
   Timeline registry — every stage registers its scrubbed timeline here so
   choreography can be inspected/tuned from one place (e.g. in the console:
   `window.__belalakTimelines`).
   ------------------------------------------------------------------------ */
const registry = new Map<string, gsap.core.Timeline>();

export function getStageTimeline(id: string): gsap.core.Timeline | undefined {
  return registry.get(id);
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // Dev-only escape hatch for tuning timings in the browser console.
  (window as unknown as Record<string, unknown>).__belalakTimelines = registry;
}

export type StageBuildArgs = {
  /** the scrubbed, pinned timeline for this stage — add tweens to it */
  tl: gsap.core.Timeline;
  root: HTMLElement;
  /** selector scoped to this stage: q(".milk-line") */
  q: gsap.utils.SelectorFunc;
  isMobile: boolean;
};

export type StagePinOptions = {
  /** unique id (also the registry key) */
  id: string;
  /** scroll distance in px the pin lasts on desktop (mobile gets 70 %) */
  length?: number;
  /** scrub smoothing in seconds; true = hard-linked to scroll */
  scrub?: number | boolean;
  /**
   * Build the scrubbed timeline. Only called when motion is allowed —
   * author all markup in its FINAL state and animate with fromTo/from so
   * reduced-motion visitors simply see the finished scene.
   */
  build: (args: StageBuildArgs) => void;
  /** fires when the visitor scrolls past the stage (any motion setting) */
  onLeave?: () => void;
  /**
   * Fires when the PIN trigger activates/deactivates. Use this (not a
   * separate ScrollTrigger) to gate work like canvas loops — a separate
   * trigger on a pinned element would not account for the pin spacer and
   * would toggle off mid-pin.
   */
  onToggle?: (active: boolean) => void;
};

/**
 * The shared scroll/pin system. Pins the section for `length` px of scroll
 * and scrubs its timeline across that distance. Handles:
 *  - prefers-reduced-motion (no pin, no scrub — static final state)
 *  - mobile (shorter pin distance)
 *  - cleanup via gsap.matchMedia contexts
 */
export function useStagePin(opts: StagePinOptions) {
  const ref = useRef<HTMLElement | null>(null);
  // Keep latest callbacks without re-running the effect.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        // Pin only where a full stage fits the viewport. On phones and
        // short windows, pinned overflow-hidden sections would clip
        // content (choice cards, spec tables) — there the same timeline
        // scrubs while the section scrolls through naturally instead.
        pin: "(min-width: 768px) and (min-height: 640px)",
      },
      (ctx) => {
        const { motion, pin } = ctx.conditions as {
          motion: boolean;
          pin: boolean;
        };
        const { id, length = 2200, scrub = 0.6, build, onLeave } =
          optsRef.current;

        if (!motion) {
          // Reduced motion: markup already shows the final state. A plain
          // (non-pinning, non-animating) trigger still fires onLeave so
          // decision defaults keep working.
          if (onLeave) {
            ScrollTrigger.create({
              trigger: root,
              start: "top center",
              end: "bottom center",
              onLeave: () => optsRef.current.onLeave?.(),
            });
          }
          return;
        }

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            scrub,
            onLeave: () => optsRef.current.onLeave?.(),
            onToggle: (self) => optsRef.current.onToggle?.(self.isActive),
            ...(pin
              ? {
                  pin: true,
                  anticipatePin: 1,
                  start: "top top",
                  end: `+=${Math.round(length)}`,
                }
              : {
                  start: "top 75%",
                  end: "bottom 65%",
                }),
          },
        });

        build({ tl, root, q: gsap.utils.selector(root), isMobile: !pin });
        registry.set(id, tl);

        return () => {
          registry.delete(id);
        };
      }
    );

    return () => mm.revert();
  }, []);

  return ref;
}

/* ---------------------------------------------------------------------------
   Shared tween helpers
   ------------------------------------------------------------------------ */

/**
 * Instrument-style numeric counter. Markup is authored with the FINAL value
 * (for reduced motion / no-JS); this rewrites textContent as it tweens.
 */
export function counterTween(
  el: Element,
  opts: {
    from: number;
    to: number;
    decimals?: number;
    suffix?: string;
    duration?: number;
    ease?: string;
  }
): gsap.core.Tween {
  const decimals = opts.decimals ?? 0;
  const suffix = opts.suffix ?? "";
  const state = { v: opts.from };
  const render = () => {
    el.textContent = state.v.toFixed(decimals) + suffix;
  };
  render(); // show the start value as soon as the timeline is built
  return gsap.to(state, {
    v: opts.to,
    duration: opts.duration ?? 1,
    ease: opts.ease ?? "none",
    onUpdate: render,
  });
}

/**
 * “Draw this pipe/stream” — strokes reveal from start to end using
 * dashoffset (no paid plugins). The element must be an SVG geometry
 * element (path/line/polyline/circle/rect).
 */
export function drawTween(
  el: Element,
  vars: gsap.TweenVars = {}
): gsap.core.Tween {
  const len = (el as SVGPathElement).getTotalLength();
  return gsap.fromTo(
    el,
    { strokeDasharray: len, strokeDashoffset: len, opacity: 1 },
    { strokeDashoffset: 0, ease: "none", ...vars }
  );
}
