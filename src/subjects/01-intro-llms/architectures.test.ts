import { describe, expect, it } from "vitest";
import { ARCHITECTURES, outputKind, visibility } from "./architectures";

describe("architectures", () => {
  it("decoders see only the past (lower triangle)", () => {
    expect(visibility("decoder", 3)).toEqual([
      [true, false, false],
      [true, true, false],
      [true, true, true],
    ]);
  });

  it("encoders see every position", () => {
    expect(visibility("encoder", 3).flat().every(Boolean)).toBe(true);
  });

  it("bag-of-words sees each word on its own", () => {
    expect(visibility("bow", 2)).toEqual([
      [true, false],
      [false, true],
    ]);
  });

  it("encoder-decoder reports the decoder's causal self-attention", () => {
    expect(visibility("encoder-decoder", 3)).toEqual(visibility("decoder", 3));
  });

  it("describes each output", () => {
    for (const a of ARCHITECTURES) expect(outputKind(a.id).length).toBeGreaterThan(5);
  });
});
