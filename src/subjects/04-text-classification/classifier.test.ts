import { describe, expect, it } from "vitest";
import { accuracy, confusionMatrix, predictProba, trainSoftmax } from "./classifier";

// Two well-separated classes in 2-D, plus a third class.
const X = [[2, 0], [2.2, 0.1], [1.8, -0.1], [0, 2], [0.1, 2.2], [-0.1, 1.9], [-2, -2], [-2.1, -1.8]];
const y = [0, 0, 0, 1, 1, 1, 2, 2];

describe("softmax classifier head", () => {
  it("learns a linearly separable toy set to 100%", () => {
    const m = trainSoftmax(X, y, 3, { epochs: 300, lr: 0.5 });
    const pred = X.map((x) => argmax(predictProba(m, x)));
    expect(accuracy(y, pred)).toBe(1);
  });

  it("loss decreases", () => {
    const m = trainSoftmax(X, y, 3, { epochs: 100, lr: 0.5 });
    expect(m.lossHistory).toHaveLength(100);
    expect(m.lossHistory.at(-1)!).toBeLessThan(m.lossHistory[0]!);
    expect(m.lossHistory[0]).toBeCloseTo(Math.log(3), 5); // zero init → uniform guess
  });

  it("is deterministic", () => {
    expect(trainSoftmax(X, y, 3, { epochs: 50, lr: 0.3 }).W).toEqual(trainSoftmax(X, y, 3, { epochs: 50, lr: 0.3 }).W);
  });

  it("probabilities sum to 1", () => {
    const m = trainSoftmax(X, y, 3, { epochs: 20, lr: 0.5 });
    const p = predictProba(m, [1, 1]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it("class with no examples", () => {
    const m = trainSoftmax(X.slice(0, 6), y.slice(0, 6), 3, { epochs: 100, lr: 0.5 });
    // Training examples are never assigned to the empty class (inputs far from all training data can be).
    const preds = X.slice(0, 6).map((x) => argmax(predictProba(m, x)));
    expect(preds).not.toContain(2);
    expect(m.lossHistory.every(Number.isFinite)).toBe(true);
    expect(m.W.flat().every(Number.isFinite)).toBe(true);
  });

  it("confusion matrix counts", () => {
    expect(confusionMatrix([0, 0, 1, 2], [0, 1, 1, 2], 3)).toEqual([
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    expect(accuracy([0, 1, 1], [0, 1, 0])).toBeCloseTo(2 / 3);
  });
});

function argmax(v: number[]): number {
  return v.indexOf(Math.max(...v));
}
