import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        milk: "#FAFAFA",
        cream: "#FFF7E8",
        silver: "#D9D9D9",
        deep: {
          DEFAULT: "#0A2E52",
          50: "#EEF4FA",
          100: "#D7E4F2",
          200: "#AFC9E5",
          300: "#7FA8D3",
          400: "#4F86C0",
          500: "#2D659F",
          600: "#1C4B7E",
          700: "#123A66",
          800: "#0A2E52",
          900: "#071F38",
          950: "#041527",
        },
        gold: {
          DEFAULT: "#C9A96A",
          light: "#E4CC9B",
          dark: "#A8873F",
        },
      },
      fontFamily: {
        serif: ['"Playfair Display Variable"', "Georgia", "serif"],
        sans: ['"Inter Variable"', "system-ui", "-apple-system", "sans-serif"],
      },
      letterSpacing: {
        kicker: "0.22em",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "float-slow": "float 9s ease-in-out infinite",
        "float-slower": "float 14s ease-in-out infinite",
        "spin-slow": "spin 14s linear infinite",
        "ping-soft": "ping-soft 2.6s cubic-bezier(0, 0, 0.2, 1) infinite",
        shimmer: "shimmer 2.8s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "ping-soft": {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "80%, 100%": { transform: "scale(2.4)", opacity: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-150%) skewX(-12deg)" },
          "60%, 100%": { transform: "translateX(250%) skewX(-12deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
