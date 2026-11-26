import { MODEL_CONFIGS, paramBreakdown } from "../../01-intro-llms/modelConfigs";
import { DEFAULT_CORPUS } from "../Stage";
import minilm from "./data/minilm.json";
import tokens from "./data/tokens.json";

/** Published configs with exact parameter counts (Module 01's tested modelConfigs). */
const models = MODEL_CONFIGS.map((c) => ({
  name: c.name,
  vocab: c.vocab,
  d_model: c.dModel,
  tied_embeddings: c.tiedEmbeddings,
  total_params: paramBreakdown(c).total,
}));

/** Data injected into Python as DATA, keyed by Exercise.data. Every number is generated, never typed. */
export const deepData: Record<string, unknown> = {
  /** Real all-MiniLM-L6-v2 outputs (scripts/make-embedding-fixtures.mjs --m02-out). */
  minilm,
  /** Real GPT-4 / GPT-4o token counts, pieces, vocabulary sizes and BERT ids (scripts/make-m02-token-data.mjs). */
  tokens,
  models,
  /** The BPE steps' corpus: the same Sennrich et al. (2016) example the BPE views start with. */
  bpe: { corpus: DEFAULT_CORPUS },
  /** Step 2's exercise data: real vocabulary sizes, BERT ids and model sizes. */
  vocab: { sizes: tokens.vocab_sizes, bert_ids: tokens.bert_ids, models },
};
