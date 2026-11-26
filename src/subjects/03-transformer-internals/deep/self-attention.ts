import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const selfAttention: DeepLesson = {
  why: [
    "You've built attention from its parts: queries, keys, values, a scaled softmax. Now let's watch it run in a real model. What do trained attention heads actually do? Do they link `loan` to `bank`, the way textbook diagrams suggest? Or something stranger?",
    "This step looks inside GPT-2 small, a real model with 12 layers of 12 heads each, 144 heads in total. Every weight you'll see was recorded from the actual model reading real sentences. Some heads do something beautifully simple: one of them, in layer 4, looks at the previous token more than 99.9% of the time, a building block for copying patterns. Many others do something that surprised researchers when they first noticed it: they park almost all their attention on the very first token, whatever it is. And a few spread their attention widely, mixing in context from across the sentence.",
    "You'll also meet the rule that makes GPT a *generator*: the **causal mask**. A decoder must never peek at tokens that come later, because when it generates text, those tokens don't exist yet. You'll implement the mask, confirm that all 144 of GPT-2's heads obey it exactly, find the previous-token head yourself in the real weights, count the heads that act as attention sinks, and see why attention's cost grows with the square of the input length.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's look at real weights. GPT-2 read `The bank approved the loan because the customer had a steady income`. Here's where the last token, ` income`, puts its attention in three different heads (layers and heads are counted from 0, as in Hugging Face):",
    },
    {
      kind: "table",
      caption: "Where the last token, ' income', looks in three real GPT-2 heads",
      columns: ["key token", "layer 4, head 11", "layer 5, head 1", "layer 1, head 6"],
      rows: [
        ["'The'", 0, 0.999, 0.262],
        ["' bank'", 0, 0, 0.116],
        ["' approved'", 0, 0, 0.048],
        ["' the'", 0, 0, 0.088],
        ["' loan'", 0, 0, 0.04],
        ["' because'", 0, 0, 0.023],
        ["' the'", 0, 0, 0.085],
        ["' customer'", 0, 0, 0.077],
        ["' had'", 0, 0, 0.038],
        ["' a'", 0, 0, 0.054],
        ["' steady'", 1, 0, 0.045],
        ["' income'", 0, 0.001, 0.122],
      ],
      source: "worked/self-attention.py",
    },
    {
      kind: "text",
      text: "Three completely different behaviours. Layer 4's head 11 puts all its weight on the previous token, ` steady`. Layer 5's head 1 puts 99.9% on the first token, `The`. Layer 1's head 6 spreads out. Are these flukes of one sentence? Average every head's behaviour over 8 sentences:",
    },
    {
      kind: "table",
      caption: "What real GPT-2 heads specialise in (8 sentences)",
      columns: ["behaviour", "head", "average weight"],
      rows: [
        ["previous", "layer 4, head 11", 0.997],
        ["previous", "layer 2, head 2", 0.576],
        ["previous", "median of all 144 heads", 0.152],
        ["first", "layer 5, head 1", 0.996],
        ["first", "layer 7, head 2", 0.991],
        ["first", "median of all 144 heads", 0.663],
        ["self", "layer 0, head 1", 0.948],
        ["self", "median of all 144 heads", 0.053],
      ],
      source: "worked/self-attention.py",
    },
    {
      kind: "table",
      caption: "Two facts from all 144 heads on this sentence",
      columns: ["measurement", "value"],
      rows: [
        ["largest weight on a future token", 0],
        ["heads putting over half their attention on the first token", 104],
      ],
      source: "worked/self-attention.py",
    },
  ],
  concept: [
    {
      heading: "A real attention layer",
      paragraphs: [
        "In a real model, every head of every layer computes its own n × n table of weights, and each row is one token's view of the sentence. GPT-2 small has 144 such tables per input. Reading them is one of the few direct windows into what a trained model is doing, and tools like the one in this step's lab are how researchers first spotted patterns such as the previous-token head.",
        "But be careful with the textbook story. Diagrams often show a head that links `loan` to `bank` or `it` to the noun it refers to. Heads like that do exist, but most of the 144 aren't that tidy. In our sentence, the strongest single weight from ` loan` back to ` bank` across all heads is 0.299 (layer 1, head 6), and most heads give ` bank` almost nothing. Attention weights also show only *where* a head looks, not what it takes from there or how later layers use it, so researchers treat them as clues, not explanations.",
        "You can get these tables from any Hugging Face model: pass `output_attentions=True` (with the plain \"eager\" attention implementation, since fused kernels never build the table) and you get one array per layer, shaped batch × heads × n × n. That's exactly how this step's data was recorded.",
      ],
      lab: { view: "real-heads", label: "Real GPT-2 heads", task: "Pick a sentence, a layer and a head, then click a token to see its row. Find a head that looks one token back, one that stares at the first token, and one that spreads out." },
    },
    {
      heading: "The causal mask: no peeking at the future",
      paragraphs: [
        "A decoder like GPT is trained to predict each next token from the ones before it. If token 5 could attend to token 6 during training, it could simply read the answer, and the model would learn nothing useful. So before the softmax, every score where the key comes *after* the query is set to −∞. After the softmax, those weights are exactly 0, and every row still sums to 1 over the tokens that remain.",
        "The result is a lower-triangular weight matrix: token 0 can only see itself, token 1 sees tokens 0 and 1, and so on. In GPT-2's real weights, the largest weight on any future token, across all 144 heads, is exactly 0. Encoders like BERT leave the mask off, so every token sees the whole input in both directions; that's why they're good at understanding text and can't generate it left to right (Module 01).",
        "The mask is also what makes the KV cache possible (Module 04). Because no token ever looks forward, a token's keys and values never change once computed, however much text comes after it.",
      ],
      formula: {
        expr: "S[i, j] = q_i · k_j / √d   if j ≤ i,   −∞ if j > i          W = softmax(S) row by row",
        symbols: [
          { sym: "i", meaning: "the query's position" },
          { sym: "j", meaning: "the key's position; j > i means the key is in the future" },
          { sym: "−∞", meaning: "exp(−∞) = 0, so future keys get exactly zero weight" },
        ],
        example: "With equal scores, token 2 gives 1/3 to each of tokens 0, 1 and 2, and 0 to everything after.",
      },
      mistake: "Applying the mask after the softmax by zeroing future weights. The remaining weights then no longer sum to 1; mask the scores with −∞ before the softmax instead.",
      lab: { view: "attention", label: "Causal mask", task: "Toggle the causal mask on and off and watch the upper triangle of the heatmap. Which tokens lose the most when the mask goes on? (This view's heads are illustrative.)" },
    },
    {
      heading: "What real heads learn: previous tokens and attention sinks",
      paragraphs: [
        "Two patterns stand out in GPT-2. The first is the **previous-token head**: layer 4, head 11 puts 99.7% of its weight on the token just before, averaged over 8 sentences. On its own that sounds trivial, but it's a component of a famous mechanism: researchers at Anthropic showed that a previous-token head in one layer combined with a matching head in a later layer forms an **induction head**, which lets a model continue a pattern it saw earlier in the context (if `A B` appeared before, predict `B` after the next `A`).",
        "The second is stranger. The median head puts 66% of its attention on the first token, and 104 of the 144 heads give it more than half on our sentence, even though `The` carries little meaning. Xiao et al. (2023) named this the **attention sink**: softmax forces every row to sum to 1, so a head with nothing useful to look at needs somewhere harmless to put its weight, and models learn to use the first position. It matters in practice: their StreamingLLM method keeps the first few tokens in the cache when long conversations are trimmed, because dropping them makes generation fall apart.",
      ],
      lab: { view: "head-finder", label: "Head finder", task: "Colour all 144 heads by previous-token, first-token and self attention. Which layers hold the previous-token heads? Where do the sinks start?" },
    },
    {
      heading: "The cost of attention grows with n²",
      paragraphs: [
        "Every head builds an n × n table, so doubling the input quadruples attention's work and the size of those tables. For GPT-2's 12-token sentence that's 144 numbers per head; for a 100,000-token document it's 10 billion per head, per layer. That quadratic cost is the main reason long context is expensive, and why so much engineering goes into avoiding it: FlashAttention computes the same result without ever storing the full table, and the KV cache (Module 04) avoids recomputing the past during generation.",
        "Keep the proportions in mind, though. For short and medium inputs, the matrix products in the projections and the feed-forward network still dominate the compute; the n² term takes over only once n is large compared with d_model.",
      ],
      lab: { view: "attn-cost", label: "Attention cost", task: "Double the input length a few times and watch the attention tables grow. At what length does one layer's tables pass a gigabyte?" },
    },
  ],
  guided:
    "In **Real GPT-2 heads**, predict where layer 4, head 11 will look for the last token before you click it. Then open **Head finder** and count how many layers contain a strong first-token head.",
  build: {
    id: "m03-self-attention",
    title: "Mask attention, and find specialised heads in real GPT-2 weights",
    packages: ["numpy"],
    data: "m03",
    parts: [
      part("self-attention", "p1", "Implement the causal mask with −∞ before the softmax, and confirm that all 144 of GPT-2's real heads are causal.", [
        "`np.triu(np.ones((n, n), dtype=bool), k=1)` is True exactly above the diagonal.",
        "A head is causal when `np.triu(W, k=1)` is all zeros.",
      ]),
      part("self-attention", "p2", "Score every head for looking at the previous token, and find GPT-2's previous-token head in the real weights.", [
        "The previous-token weights are `W[i, i - 1]` for i from 1 to n − 1; average them.",
        "Loop over layers and heads and keep the (score, layer, head) with the highest score.",
      ]),
      part("self-attention", "p3", "Measure how much each head attends to the first token, and count the attention sinks.", [
        "`W[1:, 0]` is every query's weight on token 0, except query 0 itself.",
        "Count the heads whose average is above the threshold.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m03-attn-mask",
      prompt: "Why does a decoder like GPT apply a causal mask during training?",
      options: [
        "To save memory",
        "So each token can only use earlier tokens; otherwise it could read the very token it is being trained to predict",
        "To make attention symmetric",
        "Because the first token is always a special token",
      ],
      correctIndex: 1,
      explanation: "Training predicts every next token at once. Without the mask, position i could attend to position i + 1 and copy the answer.",
    },
    {
      id: "m03-attn-sink",
      prompt: "Many of GPT-2's heads put most of their attention on the first token. What is the usual explanation?",
      options: [
        "The first token is always the most important word",
        "Softmax makes every row sum to 1, so heads with nothing useful to attend to learn to park their weight on the first position (an attention sink)",
        "It is a bug in GPT-2",
        "The causal mask forces it",
      ],
      correctIndex: 1,
      explanation: "Xiao et al. (2023) called these attention sinks; keeping the first tokens in the cache is what lets StreamingLLM generate over very long inputs.",
    },
  ],
  oneSentence:
    "In a real decoder, every head turns causally masked scores into an n × n table of weights (zero for every future token); trained heads specialise, from GPT-2's near-perfect previous-token head to the many heads that park their weight on the first token, and the tables grow with the square of the input length.",
  deeper: [
    {
      label: "Olsson et al. 2022, In-context Learning and Induction Heads",
      url: "https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html",
      adds: "How a previous-token head and a later head combine into induction heads that copy patterns from the context.",
    },
    {
      label: "Xiao et al. 2023, Efficient Streaming Language Models with Attention Sinks",
      url: "https://arxiv.org/abs/2309.17453",
      adds: "Why models dump attention on the first tokens, and how keeping them enables very long streaming generation.",
    },
    {
      label: "Clark et al. 2019, What Does BERT Look At?",
      url: "https://arxiv.org/abs/1906.04341",
      adds: "A classic survey of what individual attention heads do, in an encoder.",
    },
  ],
};
