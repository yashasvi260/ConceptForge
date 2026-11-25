import { describe, expect, it } from "vitest";
import { tokenProbs } from "./probs";

describe("probability inspector", () => {
  it("tokenProbs converts logprobs and sorts alternatives", () => {
    const r = tokenProbs([{ token: "card", logprob: Math.log(0.6), top: [{ token: "fraud", logprob: Math.log(0.3) }, { token: "card", logprob: Math.log(0.6) }] }]);
    expect(r[0]!.token).toBe("card");
    expect(r[0]!.p).toBeCloseTo(0.6, 10);
    expect(r[0]!.alternatives.map((a) => a.token)).toEqual(["card", "fraud"]);
    expect(r[0]!.alternatives[1]!.p).toBeCloseTo(0.3, 10);
  });
});
