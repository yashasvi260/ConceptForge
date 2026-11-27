import { MODEL_CONFIGS, paramBreakdown } from "../../01-intro-llms/modelConfigs";
import gen from "../data/generation.json";

/** Published configs (Module 01's tested modelConfigs) with exact parameter counts. */
const models = MODEL_CONFIGS.map((c) => ({
  name: c.name,
  family: c.family,
  vocab: c.vocab,
  d_model: c.dModel,
  layers: c.layers,
  heads: c.heads,
  kv_heads: c.kvHeads,
  ffn: c.ffn,
  context: c.context,
  tied_embeddings: c.tiedEmbeddings,
  total_params: paramBreakdown(c).total,
}));

/** Data injected into Python as DATA, keyed by Exercise.data. Every number is recorded or computed, never typed. */
export const deepData: Record<string, unknown> = {
  /** Real GPT-2 small generation data (scripts/record-m04-generation.mjs) plus the published model configs. */
  m04: { gen, models },
};
