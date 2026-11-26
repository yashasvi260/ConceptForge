import { MODEL_CONFIGS } from "../modelConfigs";
import minilm from "./data/minilm.json";

/** Data injected into Python as DATA, keyed by Exercise.data. */
export const deepData: Record<string, unknown> = {
  /** Real all-MiniLM-L6-v2 vectors (scripts/make-embedding-fixtures.mjs --deep-out). */
  minilm,
  configs: Object.fromEntries(
    MODEL_CONFIGS.map((c) => [
      c.id,
      {
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
      },
    ]),
  ),
};
