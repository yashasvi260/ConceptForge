import { describe, expect, it } from "vitest";
import { COURSE, PART_TITLES, TRACK, nextModule, trackGroups } from "./track";
import { SUBJECTS } from "./registry";

const CURRICULUM_IDS = [
  "01-intro-llms", "02-tokens-embeddings", "03-transformer-internals", "04-text-classification",
  "05-clustering-topics", "06-prompt-engineering", "07-agents-tools", "08-semantic-search-rag",
  "09-multimodal-llms", "10-training-embeddings", "11-finetuning-encoders", "12-finetuning-generation",
  "13-inference-serving", "14-evals-guardrails",
];

describe("track", () => {
  it("lists the 14 curriculum modules in order with their parts", () => {
    expect(TRACK.map((m) => m.id)).toEqual(CURRICULUM_IDS);
    expect(TRACK.map((m) => m.moduleNumber)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    expect(TRACK.map((m) => m.part)).toEqual([1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4]);
  });

  it("has the curriculum part titles", () => {
    expect(PART_TITLES).toEqual({
      1: "Part I · Understanding Language Models",
      2: "Part II · Using Pretrained Language Models",
      3: "Part III · Training and Fine-Tuning Language Models",
      4: "Part IV · Production Inference & Guardrails",
    });
  });

  it("finds the next module", () => {
    expect(nextModule("03-transformer-internals")?.id).toBe("04-text-classification");
    expect(nextModule("14-evals-guardrails")).toBeUndefined();
  });

  it("groups by part and attaches built subjects", () => {
    const groups = trackGroups(SUBJECTS);
    expect(groups.map((g) => g.part)).toEqual([1, 2, 3, 4]);
    expect(groups.flatMap((g) => g.modules)).toHaveLength(14);
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
