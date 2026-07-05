import { defineConfig } from "vitest/config";

export default defineConfig({
  // Inline (empty) postcss config stops Vite from discovering unrelated
  // postcss configs in ancestor directories.
  css: { postcss: {} },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
