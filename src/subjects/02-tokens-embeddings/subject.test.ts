import { describe, expect, it } from "vitest";
import { validateSubject } from "../../core/registry";
import tokenization from ".";

describe("tokenization subject", () => {
  it("is complete: 14 steps and hinted challenges linked to steps, incl. ≥ 4 on embeddings", () => {
    expect(validateSubject(tokenization)).toEqual([]);
    expect(tokenization.steps).toHaveLength(14);
    const embeddingSteps = new Set(tokenization.steps.filter((s) => s.section === "Embeddings").map((s) => s.id));
    expect(tokenization.challenges.filter((c) => embeddingSteps.has(c.relatedStepId!)).length).toBeGreaterThanOrEqual(4);
    expect(tokenization.challenges.length).toBeGreaterThanOrEqual(15);
    for (const c of tokenization.challenges) {
      expect(c.hint, c.id).toBeTruthy();
      expect(c.relatedStepId, c.id).toBeTruthy();
    }
  });
});
