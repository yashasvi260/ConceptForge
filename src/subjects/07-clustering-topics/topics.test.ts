import { describe, expect, it } from "vitest";
import clusters from "./data/default-clusters.json";
import data from "./data/docs.json";
import { topicPrompt, topicRecording } from "./topics";

const docs = (ids: string[]) => ids.map((id) => data.docs.find((d) => d.id === id)!);

describe("recorded topic names", () => {
  it("are found for the default clusters", () => {
    for (const g of clusters.groups) expect(topicRecording(docs(g.ids), g.keywords), g.key).toBeDefined();
  });

  it("are not reused when the same members get different keywords (a different prompt)", () => {
    const g = clusters.groups[0]!;
    expect(topicRecording(docs(g.ids), [...g.keywords].reverse())).toBeUndefined();
  });

  it("builds the prompt from keywords and comments", () => {
    const g = clusters.groups[0]!;
    const p = topicPrompt(docs(g.ids), g.keywords);
    expect(p).toContain(g.keywords.join(", "));
    expect(p).toContain(docs(g.ids)[0]!.text);
  });
});
