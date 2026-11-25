import { describe, expect, it } from "vitest";
import { MODEL_CONFIGS, paramBreakdown } from "./modelConfigs";

const cfg = (id: string) => MODEL_CONFIGS.find((c) => c.id === id)!;

describe("model configs and parameter counts", () => {
  it("GPT-2 small has exactly 124,439,808 parameters", () => {
    expect(paramBreakdown(cfg("gpt2-small")).total).toBe(124_439_808);
  });

  it("Llama 3 8B has exactly 8,030,261,248 parameters", () => {
    expect(paramBreakdown(cfg("llama3-8b")).total).toBe(8_030_261_248);
  });

  it("GPT-3 175B comes out at about 175 billion", () => {
    const t = paramBreakdown(cfg("gpt3-175b")).total;
    expect(Math.abs(t - 175e9) / 175e9).toBeLessThan(0.005);
  });

  it("layers hold most parameters in Llama 3 8B", () => {
    const b = paramBreakdown(cfg("llama3-8b"));
    expect(b.layers / b.total).toBeGreaterThan(0.8);
    expect(b.embedding + b.layers + b.head).toBe(b.total);
  });

  it("tied embeddings mean no separate output head", () => {
    expect(paramBreakdown(cfg("gpt2-small")).head).toBe(0);
    expect(paramBreakdown(cfg("llama3-8b")).head).toBe(128_256 * 4096);
  });

  it("every config cites a source", () => {
    for (const c of MODEL_CONFIGS) expect(c.source, c.id).toMatch(/^https:\/\//);
  });
});
