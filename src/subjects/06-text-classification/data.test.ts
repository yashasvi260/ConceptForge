import { describe, expect, it } from "vitest";
import data from "./data/tickets.json";
import emb from "./data/ticket-embeddings.json";

describe("ticket dataset", () => {
  it("ticket embeddings match tickets", () => {
    expect(emb.vectors).toHaveLength(data.tickets.length);
    for (const v of emb.vectors) expect(v).toHaveLength(384);
  });

  it("every label has train and ≥ 2 test tickets; ids are unique", () => {
    for (const l of data.labels) {
      const mine = data.tickets.filter((t) => t.label === l.id);
      expect(mine.filter((t) => t.split === "test").length, l.id).toBeGreaterThanOrEqual(2);
      expect(mine.filter((t) => t.split === "train").length, l.id).toBeGreaterThanOrEqual(4);
    }
    expect(new Set(data.tickets.map((t) => t.id)).size).toBe(data.tickets.length);
    expect(data.promptTemplate).toContain("{ticket}");
  });
});
