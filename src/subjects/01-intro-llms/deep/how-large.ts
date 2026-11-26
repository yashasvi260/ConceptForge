import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const howLarge: DeepLesson = {
  why: [
    "People describe models by one number: GPT-2 has 124 million, Llama 3 has 8 billion, GPT-3 has 175 billion. That number is the count of **parameters**, the learned numbers inside every table and matrix you met in the anatomy step. It decides how much the model can absorb, how much memory it needs, how fast it runs and how much it costs to train.",
    "It is easy to treat that number as marketing. It isn't. It follows exactly from a handful of settings in the model's published configuration: how many blocks, how wide each vector is, how wide the feed-forward layer is, how big the vocabulary is. If you can count the parameters yourself you understand where every part of the model lives, and you can answer practical questions immediately: will this model fit on my GPU? Why does a 7B model need 14 GB? Why did doubling the vocabulary barely change the size?",
    "This step derives the count for GPT-2 small, line by line, to the exact published total, then has you write the counting function for both GPT-2-style and Llama-style models.",
  ],
  worked: [
    {
      kind: "text",
      text: "GPT-2 small's configuration: vocabulary V = 50,257, width d = 768, context window 1,024 positions, 12 blocks, feed-forward width 3,072. A matrix that maps width a to width b has a × b weights, plus b biases if it has biases (GPT-2 does). Start with one block:",
    },
    {
      kind: "table",
      caption: "Inside one GPT-2 small block",
      columns: ["part", "formula", "parameters"],
      rows: [
        ["attention: Q, K, V together", "768 × 2,304 + 2,304", "1,771,776"],
        ["attention: output projection", "768 × 768 + 768", "590,592"],
        ["feed-forward: widen", "768 × 3,072 + 3,072", "2,362,368"],
        ["feed-forward: narrow", "3,072 × 768 + 768", "2,360,064"],
        ["two LayerNorms", "2 × (768 + 768)", "3,072"],
        ["one block", "sum of the above", "7,087,872"],
      ],
      source: "worked/how-large.py",
    },
    {
      kind: "text",
      text: "Now the whole model. The output head is **tied**: GPT-2 reuses the token embedding table to score the vocabulary, so the head adds nothing.",
    },
    {
      kind: "table",
      caption: "GPT-2 small, all parts",
      columns: ["part", "formula", "parameters", "% of total"],
      rows: [
        ["token embedding table", "50,257 × 768", "38,597,376", 31],
        ["position table", "1,024 × 768", "786,432", 0.6],
        ["12 blocks", "12 × 7,087,872", "85,054,464", 68.3],
        ["final LayerNorm", "768 + 768", "1,536", 0.001],
        ["output head", "tied: reuses the token table", "0", 0],
        ["total", "", "124,439,808", 100],
      ],
      source: "worked/how-large.py",
    },
    {
      kind: "math",
      text: "38,597,376 + 786,432 + 85,054,464 + 1,536 = 124,439,808   (the exact published count)",
    },
    {
      kind: "text",
      text: "And memory: each parameter is stored as a number of a chosen precision. For Llama 3 8B (8,030,261,248 parameters):",
    },
    {
      kind: "table",
      caption: "Memory for Llama 3 8B's 8,030,261,248 parameters",
      columns: ["number format", "bytes per parameter", "memory for the weights"],
      rows: [
        ["fp32 (32-bit)", 4, "32.12 GB"],
        ["fp16 / bf16", 2, "16.06 GB"],
        ["int8", 1, "8.03 GB"],
        ["int4", 0.5, "4.02 GB"],
      ],
      source: "worked/how-large.py",
    },
  ],
  concept: [
    {
      heading: "What a parameter is",
      paragraphs: [
        "A **parameter** (also called a **weight**) is one number that training is allowed to change. Every entry of the embedding table, every entry of every matrix in every block, every scale in every normalisation layer is one parameter. Training starts them at small random values and nudges all of them, billions of times, until the model predicts text well.",
        "Two things are *not* parameters, even though they shape the model: the **tokenizer** (a fixed lookup built before training) and the **settings** in the configuration (layer count, widths). The settings are chosen by people and fixed before training; they are sometimes called hyperparameters. The parameter count is a consequence of the settings.",
        "The parameters are the model. When you download Llama 3 8B, the file is almost entirely those 8 billion numbers; the code that runs them is a few hundred lines.",
      ],
    },
    {
      heading: "Counting them from the configuration",
      paragraphs: [
        "Every learned matrix maps one width to another, so it holds (input width) × (output width) numbers, plus one bias per output if the model uses biases. Walk through the anatomy: the embedding table maps a token to d numbers (V × d). In each block, attention needs matrices for queries, keys, values and the output (4 × d × d in a plain model), and the feed-forward network widens to d_ff and narrows back (2 × d × d_ff). Add the small normalisation layers and you have one block; multiply by the number of blocks.",
        "Different families make different small choices, and each changes the formula. **GPT-2** has biases, LayerNorm (a scale *and* a shift per number), a learned position table and a tied head. **Llama** has no biases, RMSNorm (scale only), no position table (positions come from rotating vectors), a separate output head, a feed-forward block with three matrices instead of two (SwiGLU), and **grouped-query attention**: 32 query heads share 8 sets of keys and values, so the K and V matrices are a quarter of the size.",
      ],
      formula: {
        expr: "N ≈ V·d  +  L · (4·d² + 2·d·d_ff)",
        symbols: [
          { sym: "N", meaning: "total parameters (ignoring biases and norms, which are tiny)" },
          { sym: "V·d", meaning: "the embedding table: one d-wide row per vocabulary token" },
          { sym: "L", meaning: "number of transformer blocks" },
          { sym: "4·d²", meaning: "attention's four d × d matrices: query, key, value, output" },
          { sym: "2·d·d_ff", meaning: "the feed-forward network's widen and narrow matrices" },
        ],
        example: "GPT-2 small: 50,257·768 + 12·(4·768² + 2·768·3,072) = 38,597,376 + 12·7,077,888 = 123,532,032. The exact count, 124,439,808, adds positions, biases and norms (under 1% more).",
      },
    },
    {
      heading: "Where the parameters live",
      paragraphs: [
        "In GPT-2 small the embedding table is a surprisingly large 31% of the model, because the vocabulary (50,257) is large compared with the width (768). As models grow, the blocks grow with d² and L, while the table grows only with d, so the blocks take over. In Llama 3 8B, the 32 blocks hold about 87% of the parameters, even though its vocabulary is 2.5 times bigger than GPT-2's.",
        "Inside each block, the feed-forward network is the heavyweight: in GPT-2 it is 4,722,432 of the block's 7,087,872 parameters, about two thirds. When people say a model's \"knowledge\" lives in its feed-forward layers, this is part of why: that's where most of the numbers are.",
      ],
      mistake:
        "Thinking a bigger vocabulary means a much bigger model. Doubling V only grows the embedding table (and a separate head, if there is one). For an 8B model that is a few percent; for a tiny model it can be a lot.",
    },
    {
      heading: "Two other sizes that are not parameters",
      paragraphs: [
        "The **context window** is how many tokens the model can look at in one pass: 1,024 for GPT-2, 8,192 for Llama 3 8B. It is a separate setting from the parameter count, and making it longer barely adds parameters (GPT-2's position table is only 0.6% of its weights; Llama adds none). What it does cost is memory and compute *while running*, because attention compares every token with every earlier one.",
        "**Training tokens** is how much text the model read while learning: about 300 billion for GPT-3, over 15 trillion for Llama 3. A smaller model trained on far more text can beat a bigger one trained on less: the Chinchilla study (Hoffmann et al. 2022) found that, for a fixed compute budget, most earlier models were too big and trained on too little data. Parameters set capacity; training data decides how much of it gets used.",
      ],
      mistake:
        "Confusing the context window with memory of past conversations. The context window is just how much text fits into one pass. Nothing is remembered between separate conversations unless an application pastes it back in.",
    },
    {
      heading: "Memory and number formats",
      paragraphs: [
        "To run a model, its weights must sit in memory, ideally the GPU's. The bill is simple: parameters × bytes per parameter. Training usually keeps weights in 32-bit (4 bytes) or mixed 16-bit formats; running a model typically uses 16-bit (**fp16** or **bf16**, 2 bytes). Shrinking each weight to 8 or 4 bits is called **quantisation**, and it is how an 8B model fits on a laptop GPU. Module 07 measures what that costs in accuracy.",
        "This is only the weights. Running a model also needs memory for the vectors of the current prompt (the KV cache, which grows with context length), and training needs several times more for gradients and optimiser state. A useful rule of thumb for running: 16-bit weights ≈ 2 GB per billion parameters, plus some headroom.",
      ],
      formula: {
        expr: "memory (bytes) = N × (bits per parameter ÷ 8)",
        symbols: [
          { sym: "N", meaning: "the parameter count" },
          { sym: "bits", meaning: "32 (fp32), 16 (fp16/bf16), 8 (int8) or 4 (int4)" },
        ],
        example: "Llama 3 8B in bf16: 8,030,261,248 × 2 = 16,060,522,496 bytes ≈ 16.06 GB.",
      },
    },
  ],
  guided:
    "Predict first: in Llama 3 8B, will the embedding table be a bigger or smaller share than GPT-2's 31%? Switch models below and compare the bars. Then predict GPT-3's share before you click it.",
  build: {
    id: "01-how-large-count",
    title: "Count every parameter yourself",
    packages: [],
    data: "configs",
    parts: [
      part("how-large", "p1", "Write `gpt2_params(c)` from a GPT-2-style configuration. It must hit GPT-2 small's exact **124,439,808**, and the same formula must work for GPT-3.", [
        "Match each line to the worked-example table; `3 * d` biases for the fused Q, K, V matrix.",
        "Per block: `d*3*d + 3*d + d*d + d` (attention), `d*ff + ff + ff*d + d` (feed-forward), `2*(2*d)` (norms).",
      ]),
      part("how-large", "p2", "Write `llama_params(c)` for a Llama-style configuration. It must hit Llama 3 8B's exact **8,030,261,248**.", [
        "With 8 KV heads of size 4096/32 = 128, K and V each map 4096 → 1,024.",
        "No biases anywhere; three feed-forward matrices of `d * ff`; and remember the separate head `V * d`.",
      ]),
      part("how-large", "p3", "Write `memory_gb(params, bits)` and print what Llama 3 8B needs in 32, 16, 8 and 4 bits.", [
        "Bytes per parameter = `bits / 8`.",
        "Divide by `1e9` for gigabytes.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "hl-width",
      prompt: "A model doubles its width d and keeps the same number of blocks. Roughly what happens to the parameters in the blocks?",
      options: ["They double", "They grow about 4×, because the block matrices are d × d and d × d_ff (with d_ff usually 4d)", "They stay the same", "They grow 8×"],
      correctIndex: 1,
      explanation: "Block weights scale with d² (4d² for attention, 2·d·4d for the feed-forward), so doubling d gives about 4× the block parameters. The embedding table only doubles.",
    },
    {
      id: "hl-gpu",
      prompt: "You have a GPU with 12 GB of memory. Which version of an 8-billion-parameter model can hold its weights in it?",
      options: ["fp32 (about 32 GB)", "bf16 (about 16 GB)", "int8 (about 8 GB) or int4 (about 4 GB)", "None, because model size doesn't depend on the number format"],
      correctIndex: 2,
      explanation: "Memory = parameters × bytes per parameter. Only the 8-bit and 4-bit (quantised) versions fit, and you still need some room for the prompt's working memory.",
    },
  ],
  oneSentence:
    "A model's parameter count follows exactly from its configuration (vocabulary × width for the table, plus layers × about 4d² + 2·d·d_ff for the blocks), and its memory is parameters × bytes per parameter.",
  deeper: [
    { label: "GPT-2 small config.json", url: "https://huggingface.co/openai-community/gpt2/blob/main/config.json", adds: "The real settings (n_embd 768, n_layer 12, vocab 50,257) the count is computed from." },
    { label: "Llama 3 paper (Meta, 2024)", url: "https://arxiv.org/abs/2407.21783", adds: "Table 3 lists the 8B model's layers, width, FFN size, heads and KV heads; §3 covers the 15T+ training tokens." },
    { label: "Kaplan et al. 2020, Scaling Laws", url: "https://arxiv.org/abs/2001.08361", adds: "§2.1 derives N ≈ 12·L·d² for the blocks, the approximation used above." },
  ],
};
