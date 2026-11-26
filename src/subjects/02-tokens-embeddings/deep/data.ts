import { MODEL_CONFIGS, paramBreakdown } from "../../01-intro-llms/modelConfigs";
import { trainBpe } from "../bpe";
import { DEFAULT_CORPUS } from "../Stage";
import { UNIGRAM_VOCAB, UNKNOWN_CHAR_LOGPROB } from "../unigram";
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
  bpe: { corpus: DEFAULT_CORPUS, merges: trainBpe(DEFAULT_CORPUS, 10).merges.map((m) => m.pair) },
  /** Step 6's exercise data: a slice of BERT's vocabulary that is exact for its words, plus the BPE corpus. */
  wordpiece: { ...tokens.wordpiece, corpus: DEFAULT_CORPUS },
  /** Step 7's exercise data: the Unigram view's (illustrative) piece log-probabilities. */
  unigram: { vocab: UNIGRAM_VOCAB, unknown_char_logprob: UNKNOWN_CHAR_LOGPROB },
  /** Step 2's exercise data: real vocabulary sizes, BERT ids and model sizes. */
  vocab: { sizes: tokens.vocab_sizes, bert_ids: tokens.bert_ids, models },
};
