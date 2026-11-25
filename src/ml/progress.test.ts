// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

describe("model download progress (review F2)", () => {
  it("reaches every caller, not only the first one", async () => {
    vi.resetModules();
    const { loadEmbedder, currentProgress } = await import("./embeddings");
    const first: number[] = [];
    const second: number[] = [];
    const a = loadEmbedder((p) => first.push(p));
    const b = loadEmbedder((p) => second.push(p));
    await Promise.all([a, b]);
    expect(second.at(-1)).toBe(100);
    expect(currentProgress()).toBe(100);
  });
});
