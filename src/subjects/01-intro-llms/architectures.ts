export type Arch = "bow" | "encoder" | "decoder" | "encoder-decoder";

export const ARCHITECTURES: { id: Arch; label: string; examples: string }[] = [
  { id: "bow", label: "Bag-of-Words", examples: "classic NLP" },
  { id: "encoder", label: "Encoder (representation)", examples: "BERT" },
  { id: "decoder", label: "Decoder (generative)", examples: "GPT, Llama" },
  { id: "encoder-decoder", label: "Encoder-Decoder", examples: "T5, original Transformer" },
];

/**
 * Row i says which positions token i may use. Bag-of-Words: only itself (no context); encoder:
 * everything (bidirectional); decoder: itself and earlier tokens (causal). For encoder-decoder this is
 * the decoder's own self-attention (it also reads the whole encoded input through cross-attention).
 */
export function visibility(arch: Arch, n: number): boolean[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (arch === "bow") return i === j;
      if (arch === "encoder") return true;
      return j <= i;
    }),
  );
}

export function outputKind(arch: Arch): string {
  switch (arch) {
    case "bow":
      return "One count per vocabulary word. No meaning, no order.";
    case "encoder":
      return "A context-aware vector per token (and per sentence): great for classifying, searching, clustering.";
    case "decoder":
      return "A probability for every possible next token: generate text one token at a time.";
    case "encoder-decoder":
      return "Encoder reads the whole input; decoder writes an output sequence while looking back at it.";
  }
}
