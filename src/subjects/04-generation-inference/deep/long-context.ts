import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const longContext: DeepLesson = {
  why: [
    "GPT-2 could read 1,024 tokens. Llama 3 8B launched with 8,192, and Llama 3.1 with 128,000, enough for a long book. Long context is what lets a model answer questions about a whole contract, a codebase or a year of bank statements without any retrieval tricks. So why did it take years to get there, and why do long prompts still cost more?",
    "Two walls stand in the way. The first is cost: every token attends to every earlier one, so attention's work grows with the square of the length, and the KV cache from step 5 grows with every token. The second is position: a model only learns what positions mean for the lengths it was trained on. Ask GPT-2 about token 1,025 and it doesn't give a bad answer; it crashes, because its table of position vectors has 1,024 rows.",
    "There's also a reason to push through both walls: more context really does help. Feed GPT-2 a novel and its prediction loss falls from 5.2 with 2–4 tokens of context to 3.5 with several hundred. In this step you'll measure where attention starts to dominate the cost, see the real benefit of context, learn how RoPE models are stretched past their training length, and meet the main tricks for making long context affordable.",
  ],
  worked: [
    {
      kind: "text",
      text: "First the benefit. We ran GPT-2 small over 8 windows of 1,024 tokens from Pride and Prejudice and grouped every prediction by how many tokens of context it had:",
    },
    {
      kind: "table",
      caption: "GPT-2's loss by how much context it had (Pride and Prejudice, 8 windows of 1,024 tokens)",
      columns: ["tokens of context", "predictions", "average loss"],
      rows: [
        ["1", 8, 3.644],
        ["2–4", 24, 5.181],
        ["5–16", 96, 4.848],
        ["17–64", 384, 4.321],
        ["65–256", 1536, 3.776],
        ["257–1023", 6136, 3.48],
      ],
      source: "worked/long-context.py",
    },
    {
      kind: "text",
      text: "(The first row is only 8 predictions, too few to trust.) Now the cost. Kaplan et al.'s estimate of forward-pass work per token is 2 FLOPs per non-embedding parameter plus 2 · layers · context · width for attention. Here's where attention catches up with the rest, and its share at each model's own context limit:",
    },
    {
      kind: "table",
      caption: "Where attention's cost overtakes the rest of the model",
      columns: ["model", "non-embedding parameters", "layers × width", "context where attention = rest", "trained context", "attention share there"],
      rows: [
        ["GPT-2 small", 85056000, 9216, 9229, 1024, 0.1],
        ["Llama 3 8B", 6979588096, 131072, 53250, 8192, 0.133],
        ["GPT-3 175B", 173961535488, 1179648, 147469, 2048, 0.014],
      ],
      source: "worked/long-context.py",
    },
    {
      kind: "text",
      text: "And memory: the KV cache for one sequence with Llama 3 8B's shape, with full attention and with a sliding window of 4,096 tokens (Mistral 7B's choice):",
    },
    {
      kind: "table",
      caption: "KV cache for one sequence, Llama 3 8B's shape, 16-bit (GB)",
      columns: ["tokens", "full attention", "sliding window of 4,096"],
      rows: [
        [4096, 0.54, 0.54],
        [8192, 1.07, 0.54],
        [32768, 4.29, 0.54],
        [131072, 17.18, 0.54],
      ],
      source: "worked/long-context.py",
    },
  ],
  concept: [
    {
      heading: "Attention's cost grows with the context",
      paragraphs: [
        "Most of a transformer's work doesn't depend on context length at all: each token goes through the same projections and feed-forward network, about 2 FLOPs per parameter. Attention is the exception. A token at position n compares its query with n keys and mixes n values in every layer, so its cost per token grows with n, and the cost of a whole sequence grows with n².",
        "For short contexts this hardly matters. By Kaplan et al.'s estimate, attention is 13% of Llama 3 8B's work at 8,192 tokens and catches up with everything else at about 53,000. At 128,000 tokens it's over 70%. Bigger models push the crossover further out (GPT-3's is near 147,000) because their other layers are so expensive.",
        "Real measurements can look worse than the FLOP count, because naive implementations write the full n × n attention matrix to memory. On our CPU, GPT-2's prefill took 439 ms for 512 tokens but 1,330 ms for 1,024, three times as long for twice the tokens, though the FLOP count predicts only about twice as long. **FlashAttention** (Dao et al. 2022) computes exactly the same attention in tiles that never materialise the full matrix, which is why it made long contexts practical on GPUs.",
      ],
      formula: {
        expr: "FLOPs per token ≈ 2N + 2 · L · n_ctx · d",
        symbols: [
          { sym: "N", meaning: "non-embedding parameters" },
          { sym: "L, d", meaning: "layers and model width" },
          { sym: "n_ctx", meaning: "tokens of context the new token attends to" },
        ],
        example: "Llama 3 8B: attention equals the rest when n_ctx = N / (L · d) = 6,979,588,096 / 131,072 ≈ 53,250.",
      },
      lab: { view: "ctx-cost", label: "Attention's share", task: "Pick a model and slide the context length. At what length is half the work attention, and how far is that from the model's trained context?" },
    },
    {
      heading: "More context, better predictions",
      paragraphs: [
        "Why pay for long context at all? Because the model uses it. The worked table shows GPT-2's loss on a real novel falling steadily as it gets more to read: 5.18 with 2–4 tokens of context, 4.32 with 17–64, 3.48 with 257–1,023. Names, topics and style established earlier make later tokens easier to predict.",
        "But using context isn't the same as using all of it well. Liu et al. (2023) found that models answer questions best when the relevant passage is at the beginning or end of a long prompt, and noticeably worse when it's in the middle (\"lost in the middle\"). A model that accepts 128,000 tokens doesn't attend equally to every one of them, which is one reason retrieval (Module 08) still matters: putting the right two pages in front of the model often beats putting in the whole book.",
      ],
      lab: { view: "loss-by-context", label: "Context helps", task: "Read GPT-2's real loss against context length. How much does the loss fall between 2–4 tokens and 257–1,023 tokens, and in perplexity terms what does that mean?" },
    },
    {
      heading: "Positions the model never saw",
      paragraphs: [
        "The second wall is position. GPT-2 learned one position vector for each of 1,024 positions (Module 03). There is no vector for position 1,025, and asking for one is simply an IndexError, which is what we got. A learned table can't extrapolate at all.",
        "RoPE models have no table; they rotate queries and keys by an angle that grows with position, so any position can be computed. But a model trained on 8,192 tokens has only seen rotations up to position 8,191. Beyond that, the slowly rotating dimensions reach angles never seen in training, and quality collapses quickly. **Position interpolation** (Chen et al. 2023) fixes this by squeezing positions: to run at 32,768 tokens, multiply every position by 8,192 / 32,768, so the largest angle stays inside the trained range, then fine-tune briefly. Chen et al. extended LLaMA models to 32,768 tokens this way with about 1,000 fine-tuning steps.",
        "Refinements stretch the fast-rotating and slow-rotating dimensions differently (NTK-aware scaling, YaRN by Peng et al. 2023). Llama 3.1 reached its 128,000-token context with a RoPE scaling of this kind, starting from Llama 3's 8,192. ALiBi (Press et al. 2022) took another route: no position vectors at all, just a penalty on attention scores proportional to distance, which extrapolates somewhat past the training length.",
      ],
      mistake: "Assuming a model works at any length its positions can be computed for. RoPE can compute angles for position 100,000, but a model trained on 8,192 tokens has never seen them; without interpolation and fine-tuning its outputs degrade badly past the trained length.",
      lab: { view: "position-limit", label: "Beyond the trained range", task: "Pick a target length and watch RoPE's angles for one dimension pair, with and without interpolation. Which positions stay inside the angles seen in training?" },
    },
    {
      heading: "Making long context affordable",
      paragraphs: [
        "Besides FlashAttention, which makes exact attention cheaper to run, there are ways to do less attention. **Sliding-window attention** lets each token attend only to the last W tokens. Mistral 7B uses W = 4,096 and a rolling cache that holds only the last 4,096 tokens' keys and values, so its cache stops growing; information from further back still flows forward indirectly, layer by layer, because each layer's window starts from the previous layer's outputs. Some models alternate sliding-window layers with full-attention layers to get both.",
        "The cache itself can be shrunk too: fewer key-value heads (GQA, Module 03), 8-bit or 4-bit cache entries, or compressing each token's keys and values into a small latent vector as DeepSeek-V2 does. Each of these attacks one term of 2 · L · H_kv · d_head · T · b, the formula from step 5.",
        "None of this is free. A sliding window can't directly look up a detail 10,000 tokens back, quantisation adds rounding error, and interpolated positions need fine-tuning. Long-context models are a careful combination of these choices, which is why a model's advertised context length is a property of its whole training recipe, not just its architecture.",
      ],
      lab: { view: "sliding-window", label: "Sliding window", task: "Change the window and the sequence length. How many query-key products does each scheme compute, and how big is the cache at the end?" },
    },
  ],
  guided:
    "Before opening **Attention's share**, predict what fraction of Llama 3 8B's work is attention at its own 8,192-token context: under a quarter, about half, or most of it? Then use **Beyond the trained range** to see why position 32,000 is a problem for a model trained on 8,192.",
  build: {
    id: "m04-long-context",
    title: "Measure attention's share, build a sliding window and interpolate positions",
    packages: ["numpy"],
    data: "m04",
    parts: [
      part("long-context", "p1", "Estimate FLOPs per token and find where attention overtakes the rest of real models.", [
        "Attention's part is `2 * layers * context * d_model`; the rest is `2 * n_params`.",
        "They're equal when `context = n_params / (layers * d_model)`.",
      ]),
      part("long-context", "p2", "Build a causal sliding-window mask and show its work grows linearly with length.", [
        "With `i = np.arange(n)[:, None]` and `j = np.arange(n)[None, :]`, combine `j <= i` and `i - j < window`.",
        "Use `&` to combine the two boolean arrays.",
      ]),
      part("long-context", "p3", "Compute RoPE angles past the trained length, then bring them back with position interpolation.", [
        "Angles: `pos * base ** (-2 * np.arange(d_head // 2) / d_head)`.",
        "Interpolation multiplies the position by `train_len / target_len`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m04-long-cost",
      prompt: "Why does a sequence's attention cost grow with the square of its length?",
      options: [
        "Because the vocabulary grows",
        "Because each of n tokens compares its query with up to n keys, so the whole sequence needs on the order of n² comparisons",
        "Because the model gets deeper for longer inputs",
        "It doesn't; it's linear",
      ],
      correctIndex: 1,
      explanation: "The rest of the model costs the same per token, so it grows linearly; attention per token grows with n, so the sequence costs ~n².",
    },
    {
      id: "m04-long-positions",
      prompt: "GPT-2 raises an IndexError on its 1,025th token. Why?",
      options: [
        "Its vocabulary has 1,024 entries",
        "It learned one position vector for each of 1,024 positions; there's no vector for position 1,025",
        "Its KV cache is full",
        "The tokenizer refuses longer texts",
      ],
      correctIndex: 1,
      explanation: "A learned position table can't extrapolate; RoPE can compute any angle, but still needs interpolation to stay inside trained angles.",
    },
    {
      id: "m04-long-window",
      prompt: "What does a sliding window of 4,096 tokens do to Mistral 7B's KV cache on a 32,000-token input?",
      options: [
        "Nothing; it still grows with every token",
        "Caps it at the last 4,096 tokens' keys and values, so it stops growing",
        "Removes it entirely",
        "Makes it 4,096 times larger",
      ],
      correctIndex: 1,
      explanation: "Each layer only attends to the last W tokens, so only those need to be kept (a rolling buffer).",
    },
  ],
  oneSentence:
    "Long context pays off (GPT-2's loss falls from 5.2 to 3.5 as context grows) but attention's work per token grows with context and positions beyond the trained length break the model, so long-context models combine efficient exact attention, position interpolation for RoPE, smaller caches and sometimes sliding windows.",
  deeper: [
    {
      label: "Chen et al. 2023, Extending Context Window of Large Language Models via Positional Interpolation",
      url: "https://arxiv.org/abs/2306.15595",
      adds: "Why RoPE fails past its trained length and how scaling positions fixes it.",
    },
    {
      label: "Dao et al. 2022, FlashAttention",
      url: "https://arxiv.org/abs/2205.14135",
      adds: "Exact attention without writing the n × n matrix to memory.",
    },
    {
      label: "Liu et al. 2023, Lost in the Middle: How Language Models Use Long Contexts",
      url: "https://arxiv.org/abs/2307.03172",
      adds: "Evidence that models use the beginning and end of long prompts better than the middle.",
    },
  ],
};
