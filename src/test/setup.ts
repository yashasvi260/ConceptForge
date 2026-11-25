import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// ONNX Runtime can't run inside jsdom, so UI tests use real precomputed MiniLM outputs instead.
// Node-environment tests (src/ml/embeddings.test.ts) keep the real model.
vi.mock("../ml/embeddings", async (importOriginal) => {
  const real = await importOriginal<typeof import("../ml/embeddings")>();
  if (typeof window === "undefined") return real;
  const { fakeEmbedder } = await import("./fakeEmbedder");
  return { ...real, loadEmbedder: () => Promise.resolve(fakeEmbedder) };
});

// findBy*/waitFor default to 1 s; real tokenizers can take longer to load on slow CI runners.
configure({ asyncUtilTimeout: 20_000 });

afterEach(() => {
  if (typeof window === "undefined") return; // node-environment tests (e.g. the real embedding model)
  cleanup();
  window.localStorage.clear();
  window.location.hash = "";
});
