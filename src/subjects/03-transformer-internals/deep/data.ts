import { MODEL_CONFIGS, paramBreakdown } from "../../01-intro-llms/modelConfigs";
import gpt2 from "../data/gpt2.json";

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

/** Mixtral 8x7B's published configuration (https://huggingface.co/mistralai/Mixtral-8x7B-v0.1/blob/main/config.json;
 *  Jiang et al. 2024, https://arxiv.org/abs/2401.04088: 47B parameters, 13B active per token). */
export const MIXTRAL = {
  name: "Mixtral 8x7B",
  vocab: 32000,
  d_model: 4096,
  layers: 32,
  heads: 32,
  kv_heads: 8,
  ffn: 14336,
  experts: 8,
  experts_per_token: 2,
  tied_embeddings: false,
};

/** Data injected into Python as DATA, keyed by Exercise.data. Every number is recorded or computed, never typed. */
export const deepData: Record<string, unknown> = {
  /** Real GPT-2 small internals (scripts/record-m03-gpt2.mjs) plus the published model configs. */
  m03: { models, gpt2, mixtral: MIXTRAL },
};
