/** The two self-supervised pre-training objectives, made concrete. */

export interface NextTokenPair {
  context: string[];
  target: string;
}

/** GPT-style: every prefix of the text is a training example whose label is the next word. */
export function nextTokenPairs(tokens: string[]): NextTokenPair[] {
  return tokens.slice(1).map((target, i) => ({ context: tokens.slice(0, i + 1), target }));
}

export interface MlmToken {
  original: string;
  shown: string;
  /** True when the model must predict the original word here. */
  predict: boolean;
}

/**
 * BERT-style masked LM (Devlin et al. 2019, §3.1): choose 15% of positions; of those, show [MASK] 80% of
 * the time, a random word 10%, and the unchanged word 10%; the model predicts the original at every
 * chosen position. `random()` returns [0, 1); at least one position is always chosen.
 */
export function maskForMlm(tokens: string[], random: () => number, vocab: string[]): MlmToken[] {
  const out: MlmToken[] = [];
  for (const original of tokens) {
    if (random() < 0.15) {
      const r = random();
      const shown = r < 0.8 ? "[MASK]" : r < 0.9 ? vocab[Math.floor(random() * vocab.length)] ?? "[MASK]" : original;
      out.push({ original, shown, predict: true });
    } else {
      out.push({ original, shown: original, predict: false });
    }
  }
  if (tokens.length > 0 && !out.some((t) => t.predict)) {
    const i = Math.floor(random() * tokens.length) % tokens.length;
    out[i] = { original: tokens[i]!, shown: "[MASK]", predict: true };
  }
  return out;
}
