import type { Config } from "tailwindcss";

/**
 * All colors resolve to the CSS variables declared in app/globals.css —
 * that file is the single source of truth for the palette. RGB-triple
 * variables let Tailwind alpha modifiers (e.g. bg-steel/20) keep working.
 */
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        milk: token("milk"),
        ivory: token("ivory"),
        steel: {
          DEFAULT: token("steel"),
          deep: token("steel-deep"),
        },
        cream: token("cream"),
        pasture: token("pasture"),
        /** ink is an alias — body text is deep steel, not pure black */
        ink: token("steel-deep"),
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        kicker: "0.22em",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
