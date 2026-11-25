import type { SubjectModule } from "./types";

export type PartNumber = 1 | 2 | 3 | 4;

/** One module of the LLM Mastery curriculum (docs/curriculum.md), built or not. */
export interface TrackEntry {
  id: string;
  moduleNumber: number;
  title: string;
  part: PartNumber;
}

export const PART_TITLES: Record<PartNumber, string> = {
  1: "Part I · Understanding Language Models",
  2: "Part II · Using Pretrained Language Models",
  3: "Part III · Training and Fine-Tuning Language Models",
  4: "Part IV · Production Inference & Guardrails",
};

export const TRACK: readonly TrackEntry[] = [
  { id: "01-intro-llms", moduleNumber: 1, title: "Introduction to Language Models", part: 1 },
  { id: "02-tokens-embeddings", moduleNumber: 2, title: "Tokens and Embeddings", part: 1 },
  { id: "03-transformer-internals", moduleNumber: 3, title: "Looking Inside Large Language Models", part: 1 },
  { id: "04-text-classification", moduleNumber: 4, title: "Text Classification", part: 2 },
  { id: "05-clustering-topics", moduleNumber: 5, title: "Text Clustering and Topic Modeling", part: 2 },
  { id: "06-prompt-engineering", moduleNumber: 6, title: "Prompt Engineering", part: 2 },
  { id: "07-agents-tools", moduleNumber: 7, title: "Advanced Text Generation Techniques & Tools", part: 2 },
  { id: "08-semantic-search-rag", moduleNumber: 8, title: "Semantic Search and Retrieval-Augmented Generation", part: 2 },
  { id: "09-multimodal-llms", moduleNumber: 9, title: "Multimodal Large Language Models", part: 2 },
  { id: "10-training-embeddings", moduleNumber: 10, title: "Creating Text Embedding Models", part: 3 },
  { id: "11-finetuning-encoders", moduleNumber: 11, title: "Fine-Tuning Representation Models for Classification", part: 3 },
  { id: "12-finetuning-generation", moduleNumber: 12, title: "Fine-Tuning Generation Models", part: 3 },
  { id: "13-inference-serving", moduleNumber: 13, title: "Production Serving & Inference Optimization", part: 4 },
  { id: "14-evals-guardrails", moduleNumber: 14, title: "Evals, Guardrails & Failure Modes", part: 4 },
];

/** Ids that moved: old links and saved progress are redirected. */
export const LEGACY_IDS: Record<string, string> = { tokenization: "02-tokens-embeddings" };

export function resolveId(id: string | null | undefined): string | null {
  if (!id) return null;
  return LEGACY_IDS[id] ?? id;
}

export function trackEntry(id: string | null | undefined): TrackEntry | undefined {
  const resolved = resolveId(id);
  return TRACK.find((m) => m.id === resolved);
}

export function nextModule(id: string): TrackEntry | undefined {
  const i = TRACK.findIndex((m) => m.id === id);
  return i >= 0 ? TRACK[i + 1] : undefined;
}

export function moduleLabel(n: number): string {
  return `Module ${String(n).padStart(2, "0")}`;
}

export interface TrackGroup {
  part: PartNumber;
  title: string;
  modules: { entry: TrackEntry; subject?: SubjectModule }[];
}

export function trackGroups(subjects: readonly SubjectModule[]): TrackGroup[] {
  return ([1, 2, 3, 4] as const).map((part) => ({
    part,
    title: PART_TITLES[part],
    modules: TRACK.filter((m) => m.part === part).map((entry) => ({
      entry,
      subject: subjects.find((s) => s.id === entry.id),
    })),
  }));
}
