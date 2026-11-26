import { MODEL_CONFIGS } from "../modelConfigs";

/** Data injected into Python as DATA, keyed by Exercise.data. */
export const deepData: Record<string, unknown> = {
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
