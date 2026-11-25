import { describe, expect, it } from "vitest";
import { validateSubject } from "../../core/registry";
import tokenization from ".";

describe("tokenization subject", () => {
  it("is complete: 14 steps and at least 15 hinted challenges linked to steps", () => {
    expect(validateSubject(tokenization)).toEqual([]);
    expect(tokenization.steps).toHaveLength(14);
    expect(tokenization.challenges.length).toBeGreaterThanOrEqual(15);
    for (const c of tokenization.challenges) {
      expect(c.hint, c.id).toBeTruthy();
      expect(c.relatedStepId, c.id).toBeTruthy();
    }
  });
});
