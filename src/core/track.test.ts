import { describe, expect, it } from "vitest";
import { COURSE, PART_TITLES, TRACK, nextModule, resolveId, trackGroups } from "./track";
import { SUBJECTS } from "./registry";

const CURRICULUM_IDS = [
  "01-intro-llms", "02-tokens-embeddings", "03-transformer-internals", "04-generation-inference",
  "05-how-models-learn", "06-text-classification", "07-clustering-topics", "08-prompt-engineering",
  "09-semantic-search-rag", "10-agents-tools", "11-multimodal-llms", "12-training-embeddings",
  "13-finetuning-encoders", "14-finetuning-generation", "15-reasoning-distillation", "16-inference-serving",
  "17-evals-guardrails", "18-capstone",
];

describe("track", () => {
  it("lists the 18 curriculum modules (docs/curriculum.md v2) in order with their parts", () => {
    expect(TRACK.map((m) => m.id)).toEqual(CURRICULUM_IDS);
    expect(TRACK.map((m) => m.moduleNumber)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    expect(TRACK.map((m) => m.part)).toEqual([1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4]);
  });

  it("every id starts with its module number", () => {
    for (const m of TRACK) expect(m.id.startsWith(String(m.moduleNumber).padStart(2, "0") + "-"), m.id).toBe(true);
  });

  it("sends the v1 ids of renumbered modules to their new ids", () => {
    expect(resolveId("04-text-classification")).toBe("06-text-classification");
    expect(resolveId("05-clustering-topics")).toBe("07-clustering-topics");
    expect(resolveId("06-prompt-engineering")).toBe("08-prompt-engineering");
    expect(resolveId("07-agents-tools")).toBe("10-agents-tools");
    expect(resolveId("08-semantic-search-rag")).toBe("09-semantic-search-rag");
    expect(resolveId("tokenization")).toBe("02-tokens-embeddings");
  });

  it("has the curriculum part titles", () => {
    expect(PART_TITLES).toEqual({
      1: "Part I · Understanding Language Models",
      2: "Part II · Using Pretrained Language Models",
      3: "Part III · Training and Fine-Tuning Language Models",
      4: "Part IV · Production, Guardrails & Capstone",
    });
  });

  it("finds the next module", () => {
    expect(nextModule("03-transformer-internals")?.id).toBe("04-generation-inference");
    expect(nextModule("18-capstone")).toBeUndefined();
  });

  it("groups by part and attaches built subjects", () => {
    const groups = trackGroups(SUBJECTS);
    expect(groups.map((g) => g.part)).toEqual([1, 2, 3, 4]);
    expect(groups.flatMap((g) => g.modules)).toHaveLength(18);
    const m2 = groups[0]!.modules.find((m) => m.entry.id === "02-tokens-embeddings")!;
    expect(m2.subject?.id).toBe("02-tokens-embeddings");
    const built = new Set(SUBJECTS.map((s) => s.id));
    expect(groups.flatMap((g) => g.modules).every((m) => (m.subject !== undefined) === built.has(m.entry.id))).toBe(true);
  });
});

describe("course data", () => {
  it("names the course", () => {
    expect(COURSE.title).toBe("LLM Mastery");
    expect(COURSE.description.length).toBeGreaterThan(20);
  });

  it("every module has 2–4 tags", () => {
    for (const m of TRACK) {
      expect(m.tags.length, m.id).toBeGreaterThanOrEqual(2);
      expect(m.tags.length, m.id).toBeLessThanOrEqual(4);
    }
  });
});
