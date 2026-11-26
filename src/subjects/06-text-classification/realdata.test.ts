// @vitest-environment node
import { describe, expect, it } from "vitest";
import { accuracy, argmax, predictProba, trainSoftmax } from "./classifier";
import data from "./data/tickets.json";
import emb from "./data/ticket-embeddings.json";

describe("head on real MiniLM vectors", () => {
  it("trained on the train split, generalises to the test split", () => {
    const ids = data.labels.map((l) => l.id);
    const rows = data.tickets.map((t, i) => ({ t, x: emb.vectors[i]!, y: ids.indexOf(t.label) }));
    const train = rows.filter((r) => r.t.split === "train");
    const test = rows.filter((r) => r.t.split === "test");
    const m = trainSoftmax(train.map((r) => r.x), train.map((r) => r.y), ids.length, { epochs: 200, lr: 2 });
    const acc = accuracy(test.map((r) => r.y), test.map((r) => argmax(predictProba(m, r.x))));
    expect(acc, `test accuracy ${acc}`).toBeGreaterThanOrEqual(0.8);
  });
});
