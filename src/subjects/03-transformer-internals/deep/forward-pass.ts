import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const forwardPass: DeepLesson = {
  why: [
    "Module 02 ended with one vector per token: `The bank approved the loan` became a stack of rows read from an embedding table. But those rows are static. Both copies of `the` got the same vector, and `bank` knew nothing about `loan`. So what turns a pile of independent word vectors into something that can predict the next word, answer a question, or tell a lender from a riverside?",
    "The answer is the **transformer**: a stack of identical **blocks**, each of which does two things. First it lets every token look at the others and pull in what it needs (**attention**). Then it refines each token on its own with a small neural network (the **feed-forward network**). GPT-2 small stacks 12 of these blocks, Llama 3 8B stacks 32, GPT-3 stacks 96. Same recipe, repeated.",
    "Before zooming into the pieces, it pays to see the whole pipeline once, with real shapes and real parameter counts. In this step you'll follow a 12-token sentence through GPT-2 small, check that every block's output has exactly the shape of its input (that's what lets you stack them), and count where a block's parameters actually live. The answer surprises most people: not in attention, but in the feed-forward network.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's follow one real sentence. GPT-2's tokenizer reads `The bank approved the loan because the customer had a steady income` as 12 tokens. Here's the shape of the data at each stage of GPT-2 small (d_model 768, 12 heads, feed-forward width 3,072):",
    },
    {
      kind: "table",
      caption: "Shapes through GPT-2 small for one 12-token sentence",
      columns: ["stage", "shape", "numbers"],
      rows: [
        ["token IDs", "(12,)", 12],
        ["token vectors + position vectors", "(12, 768)", 9216],
        ["attention weights in one block", "(12, 12, 12)", 1728],
        ["feed-forward hidden layer", "(12, 3072)", 36864],
        ["output of every block", "(12, 768)", 9216],
      ],
      source: "worked/forward-pass.py",
    },
    {
      kind: "text",
      text: "Notice the last row: every block hands back exactly what it received, 12 × 768. That's the trick that lets you stack 12 blocks, or 96. Now count one block's parameters, from the published configurations:",
    },
    {
      kind: "table",
      caption: "Where one block's parameters live",
      columns: ["model", "attention", "feed-forward", "norms", "block total", "feed-forward %", "all blocks, % of model"],
      rows: [
        ["GPT-2 small", 2362368, 4722432, 3072, 7087872, 66.6, 68.3],
        ["Llama 3 8B", 41943040, 176160768, 8192, 218112000, 80.8, 86.9],
      ],
      source: "worked/forward-pass.py",
    },
  ],
  concept: [
    {
      heading: "A stack of identical blocks",
      paragraphs: [
        "Here's the whole forward pass in one line: look up each token's vector, add position information, run the result through N blocks, and normalise the output. Each block has the same structure, two sub-layers, each wrapped so that its result is *added* to its input instead of replacing it. The first sub-layer is attention, where tokens exchange information. The second is the feed-forward network, where each token is processed on its own. The blocks share a structure but not their weights: block 3's numbers are different from block 7's, learned separately.",
        "Why repeat the same block so many times? Because each pass can build on the last. Researchers who inspect trained models find that early blocks tend to handle local, surface patterns (which word came just before), and later blocks more abstract ones. Nobody designs that division of labour; it emerges from training. What *is* designed is that every block reads and writes the same kind of vector, so any block can use anything an earlier block wrote.",
        "One more thing that trips people up: while reading a prompt, the model doesn't go word by word. All 12 tokens go through block 1 together, then block 2, and so on, as matrices. Generation is the only sequential part: the model produces one new token, appends it, and runs again (Module 04).",
      ],
      formula: {
        expr: "h⁰ = E[ids] + P[0 … n−1]          hˡ = Blockˡ(hˡ⁻¹)  for l = 1 … L          output = Norm(hᴸ)",
        symbols: [
          { sym: "E[ids]", meaning: "the token vectors from the embedding table (Module 02)" },
          { sym: "P[…]", meaning: "position vectors (step 2); RoPE models apply position inside attention instead" },
          { sym: "Blockˡ", meaning: "block l: attention and a feed-forward network, each added back to its input" },
          { sym: "L", meaning: "the number of blocks: 12 in GPT-2 small, 32 in Llama 3 8B" },
        ],
        example: "GPT-2 small: 12 token vectors of 768 numbers go in, 12 vectors of 768 numbers come out of each of the 12 blocks.",
      },
      mistake: "Picturing the model reading a prompt one token at a time. The whole prompt passes through each block at once, as an n × d matrix; only generating new tokens is sequential.",
      lab: { view: "forward", label: "The pipeline", task: "Click through the stages from token IDs to the final vector. Which stages mix tokens together, and which treat each token on its own?" },
    },
    {
      heading: "Shapes: n × d, all the way up",
      paragraphs: [
        "If you remember one thing about transformer code, make it this: the main data is an n × d matrix, one row per token, and it keeps that shape from the first block to the last. In a batch there's one more dimension in front (batch × n × d), but every block still maps that shape to itself.",
        "Inside a block, two temporary shapes appear and disappear. Attention builds an n × n table of weights for each head, saying how much each token takes from every other; with 12 heads that's 12 × 12 × 12 for our sentence. Because it's n × n, it grows with the *square* of the input length, which is why long prompts are expensive (step 4 and Module 04). The feed-forward network temporarily widens each token, to 3,072 numbers in GPT-2 small, then projects it back to 768.",
        "Shapes are also the fastest way to debug a model you're building. If a block's output isn't the same shape as its input, the residual addition fails immediately. If the attention table isn't n × n, you've mixed up the axes. Part 1 writes the shape of every stage for any published configuration.",
      ],
      lab: { view: "shapes", label: "Shapes", task: "Change the number of tokens and switch between GPT-2 small and Llama 3 8B. Which shape grows fastest when you double the input?" },
    },
    {
      heading: "Where the parameters live",
      paragraphs: [
        "Attention gets all the attention, but count the parameters and you'll see that it isn't where most of them are. In GPT-2 small, a block's attention has 2.36 million parameters: one d × 3d matrix that produces queries, keys and values together, plus a d × d output matrix. The feed-forward network has 4.72 million: d × 4d to widen, 4d × d to narrow. That's two-thirds of the block.",
        "In Llama 3 8B the imbalance is bigger still. Its feed-forward network uses three matrices (SwiGLU, step 8) of width 14,336, so it holds 176 million of the block's 218 million parameters, about 81%. And its attention is *smaller* than you'd expect from its width, because it uses only 8 key-value heads for its 32 query heads (grouped-query attention, step 6).",
        "Add it up across the stack and the blocks hold most of the model: 68% of GPT-2 small (its 50,257-row token table is a large slice of a small model) and 87% of Llama 3 8B. Part 2 and part 3 rebuild both totals from the published configurations and match them to the parameter. Those counts matter when you load a model: every one of them has to fit in memory, and the feed-forward matrices are where most of it goes. That's also exactly the part that Mixture-of-Experts models make bigger without making every token pay for it (step 9).",
        "Parameter counts also give you a quick estimate of compute. Each parameter takes part in about one multiplication and one addition per token, so one forward pass costs roughly 2 × (parameters) floating-point operations per token, a rule of thumb from Kaplan et al. (2020). For Llama 3 8B that's about 16 billion operations for every token it reads or writes, before counting attention's n × n part.",
      ],
      lab: { view: "block-params", label: "Block parameters", task: "Compare one block of GPT-2 small with one of Llama 3 8B. Which part grows most? Turn grouped-query attention off and see what Llama's attention would cost." },
    },
  ],
  guided:
    "Before opening **Shapes**, predict the shape of the attention weights for 100 tokens in Llama 3 8B. Then open **Block parameters** and guess what share of a GPT-2 block is attention before you look.",
  build: {
    id: "m03-forward-pass",
    title: "Trace shapes and count a block, from published configurations",
    packages: ["numpy"],
    data: "m03",
    parts: [
      part("forward-pass", "p1", "Write the shape of the data at each stage of the forward pass for any model and input length.", [
        "Every key is a tuple built from `n`, `cfg[\"d_model\"]`, `cfg[\"heads\"]` and `cfg[\"ffn\"]`.",
        "Attention weights are `(heads, n, n)`: one n × n table per head.",
      ]),
      part("forward-pass", "p2", "Count one GPT-2 block's parameters, then the whole model, and match GPT-2 small's and GPT-3's published totals exactly.", [
        "Attention: `d * 3 * d + 3 * d` for the fused Q, K, V layer plus `d * d + d` for the output projection.",
        "The total adds `vocab * d` (tokens), `context * d` (positions), `layers * block` and `2 * d` for the final LayerNorm.",
      ]),
      part("forward-pass", "p3", "Count a Llama block (grouped-query attention, SwiGLU, RMSNorm) and confirm Llama 3 8B's 8,030,261,248 parameters.", [
        "K and V each map d to `kv_heads * head_dim`, with `head_dim = d // heads`: 8 × 128 = 1,024 for Llama 3 8B.",
        "SwiGLU has three d × f matrices' worth of parameters: `3 * d * f`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m03-forward-shape",
      prompt: "A block in GPT-2 small receives a 12 × 768 matrix. What shape does it return?",
      options: ["12 × 3,072", "12 × 768, the same as its input", "768 × 768", "12 × 50,257"],
      correctIndex: 1,
      explanation: "Every block maps n × d to n × d. The 3,072-wide layer exists only inside the feed-forward network, and that shared shape is what lets blocks be stacked and added to their inputs.",
    },
    {
      id: "m03-forward-params",
      prompt: "In one block of Llama 3 8B, which part holds most of the parameters?",
      options: ["Attention", "The feed-forward network, about 81%", "The two RMSNorms", "They are split evenly"],
      correctIndex: 1,
      explanation: "Its SwiGLU feed-forward network has 176,160,768 of the block's 218,112,000 parameters; grouped-query attention keeps attention comparatively small.",
    },
  ],
  oneSentence:
    "A transformer looks up token vectors, adds position, and passes the n × d matrix through a stack of identical blocks (attention, then a feed-forward network, each added back to its input) that keep the shape unchanged, with most of each block's parameters in the feed-forward network.",
  deeper: [
    {
      label: "Vaswani et al. 2017, Attention Is All You Need",
      url: "https://arxiv.org/abs/1706.03762",
      adds: "The paper that introduced the transformer block: attention plus a feed-forward network, with residual connections.",
    },
    {
      label: "Jay Alammar: The Illustrated GPT-2",
      url: "https://jalammar.github.io/illustrated-gpt2/",
      adds: "A visual walk through a decoder-only model's forward pass, block by block.",
    },
    {
      label: "Karpathy: nanoGPT model.py",
      url: "https://github.com/karpathy/nanoGPT/blob/master/model.py",
      adds: "A complete GPT-2 forward pass in about 300 lines of readable PyTorch.",
    },
  ],
};
