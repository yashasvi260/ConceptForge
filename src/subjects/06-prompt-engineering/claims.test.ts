// The lesson text makes claims about the recorded runs; these tests fail if a re-recording contradicts them.
import { describe, expect, it } from "vitest";
import type { RecordingFile } from "../../llm/recordings";
import big from "./data/recordings/experiment.json";
import small from "./data/recordings/experiment-small.json";
import { comboStats } from "./experiment";
import { ALL_COMBOS } from "./prompts";

const B = big as RecordingFile;
const S = small as RecordingFile;
const off = { role: false, fewShot: false, cot: false, schema: false };
const st = (f: RecordingFile, c: Partial<typeof off>) => comboStats(f, { ...off, ...c })!;

describe("claims in the Module 06 text", () => {
  it("both experiments are complete", () => {
    expect(B.items).toHaveLength(512);
    expect(S.items).toHaveLength(512);
    expect(B.model).toBe("gemma4:12b");
    expect(S.model).toBe("qwen2.5-coder:1.5b");
  });

  it("every schema variant gives valid JSON on every sample, for both models", () => {
    for (const f of [B, S]) for (const c of ALL_COMBOS.filter((x) => x.schema)) expect(comboStats(f, c)!.valid).toBe(32);
  });

  it("few-shot does not help the small model here, and adds prompt tokens", () => {
    expect(st(S, { fewShot: true }).fieldsCorrect).toBeLessThan(st(S, {}).fieldsCorrect);
    expect(st(S, { fewShot: true }).promptTokens! - st(S, {}).promptTokens!).toBeGreaterThan(50);
  });

  it("chain-of-thought hurts the small model and slows gemma4", () => {
    expect(st(S, { cot: true }).fieldsCorrect).toBeLessThan(st(S, {}).fieldsCorrect);
    expect(st(B, { cot: true }).avgMs).toBeGreaterThan(2 * st(B, {}).avgMs);
    expect(st(B, { cot: true }).fieldsCorrect).toBe(st(B, {}).fieldsCorrect);
  });

  it("without a schema the small model sometimes produces invalid JSON", () => {
    expect(st(S, {}).valid).toBeLessThan(32);
  });
});
