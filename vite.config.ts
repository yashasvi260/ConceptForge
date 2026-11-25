/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; the deploy workflow sets BASE_PATH=/ConceptForge/.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  // The GPT tokenizer vocabularies (o200k ≈ 2.3 MB, cl100k ≈ 1.1 MB) are intentionally large,
  // lazy-loaded chunks that only download on the steps that use them.
  build: { chunkSizeWarningLimit: 2500 },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
  },
});
