import minilm from "./data/minilm.json";
import tokens from "./data/tokens.json";

/** Data injected into Python as DATA, keyed by Exercise.data. Every number is generated, never typed. */
export const deepData: Record<string, unknown> = {
  /** Real all-MiniLM-L6-v2 outputs (scripts/make-embedding-fixtures.mjs --m02-out). */
  minilm,
  /** Real GPT-4 / GPT-4o token counts and pieces (scripts/make-m02-token-data.mjs). */
  tokens,
};
