import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const positional: DeepLesson = {
  why: [
    "Here's a puzzle. \"The dog bit the man\" and \"The man bit the dog\" contain exactly the same tokens. One is a non-event, the other is news. A model that can't tell them apart is useless. Yet the attention you'll meet in the next steps compares token vectors with each other, and nothing in that comparison says which token came first. Shuffle the tokens and attention just shuffles its outputs to match. On its own, it sees a *bag* of tokens, not a sequence.",
    "So position has to be put in explicitly. There are three main ways, and you'll meet all three in real models. The original Transformer (2017) **adds** a fixed pattern of sine and cosine waves to each token vector, a different pattern for every position. GPT-2 **learns** a table of position vectors, one row per position, just like the token table. And most recent open models (Llama, Mistral, Qwen) use **RoPE**, which doesn't add anything: it **rotates** each query and key by an angle that depends on its position, so attention scores end up depending on how far apart two tokens are.",
    "In this step you'll prove that attention without positions really is order-blind, build the sinusoidal pattern, look at what GPT-2's real learned position vectors look like, and implement RoPE to see why it makes \"3 tokens apart\" mean the same thing at the start of a document and 5,000 tokens in.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's start with the original recipe. Each position gets a vector of sines and cosines at different frequencies. The first pair of dimensions changes fast, later pairs ever more slowly, like the hands of a clock:",
    },
    {
      kind: "table",
      caption: "Sinusoidal position vectors (first 6 of 16 dimensions)",
      columns: ["position", "dim 0", "dim 1", "dim 2", "dim 3", "dim 4", "dim 5"],
      rows: [
        [0, 0, 1, 0, 1, 0, 1],
        [1, 0.841, 0.54, 0.311, 0.95, 0.1, 0.995],
        [2, 0.909, -0.416, 0.591, 0.807, 0.199, 0.98],
        [3, 0.141, -0.99, 0.813, 0.583, 0.296, 0.955],
        [50, -0.262, 0.965, -0.103, -0.995, -0.959, 0.284],
      ],
      source: "worked/positional.py",
    },
    {
      kind: "text",
      text: "GPT-2 doesn't use a formula; it learned a 1,024 × 768 table during training. What did it learn? Measure the cosine similarity between position vectors k apart, averaged over every pair in GPT-2's real table:",
    },
    {
      kind: "table",
      caption: "GPT-2's learned position vectors: similarity by distance",
      columns: ["distance k", "average cosine similarity"],
      rows: [
        [1, 0.997],
        [2, 0.997],
        [4, 0.996],
        [8, 0.99],
        [16, 0.973],
        [64, 0.73],
        [256, -0.446],
        [512, 0.276],
      ],
      source: "worked/positional.py",
    },
    {
      kind: "text",
      text: "Nearby positions are nearly identical, and similarity falls off and swings negative further away: training rediscovered a smooth, wave-like pattern on its own. Finally, RoPE. Rotate the same query and key by their positions, and the score depends only on the distance between them:",
    },
    {
      kind: "table",
      caption: "RoPE: the score depends only on the distance",
      columns: ["query position m", "key position n", "m − n", "score q·k after RoPE"],
      rows: [
        [5, 2, 3, -0.1164],
        [105, 102, 3, -0.1164],
        [3, 0, 3, -0.1164],
        [7, 2, 5, 1.1457],
        [2, 5, -3, 0.142],
      ],
      source: "worked/positional.py",
    },
  ],
  concept: [
    {
      heading: "Attention can't see order",
      paragraphs: [
        "Why does attention need help? Attention scores every pair of tokens by comparing their vectors, then averages. If you swap two tokens, their vectors swap places, every comparison involving them moves to a new row and column, and the outputs swap too, but nothing else changes. Mathematicians call this **permutation equivariance**. Part 3 checks it directly: shuffle the input, and the output is just the shuffled version of the original output.",
        "That's a disaster for language, where order carries meaning, and the fix is to make each token's vector depend on where it sits. Once position information is mixed in, the same token at position 2 and at position 7 has a different vector, the symmetry breaks, and \"dog bit man\" finally differs from \"man bit dog\".",
        "One subtlety: this is a property of attention itself, not of every model. In a decoder, the causal mask (step 4) lets token 5 see five tokens and token 1 only one, and that asymmetry alone leaks some sense of position; Haviv et al. (2022) found that decoders trained with no position information at all still learned some. Every widely used model adds explicit positions anyway, because it's cheap and reliable.",
      ],
      lab: { view: "shuffle", label: "Shuffle test", task: "Shuffle the tokens and watch the outputs move with them, unchanged. Now switch on positions and shuffle again: what changes?" },
    },
    {
      heading: "Sinusoidal positions: a barcode for every position",
      paragraphs: [
        "The original Transformer adds a fixed vector to each token's embedding. Dimension pair i is a sine and a cosine of the position, at a frequency that drops by a constant factor from one pair to the next, from one full turn every 6.3 positions for the first pair down to one turn every 63,000 positions or so for the last. Together they give every position a unique barcode, and because the waves are smooth, nearby positions get similar barcodes.",
        "The authors chose waves for a reason: for any fixed distance k, the vector at position p + k is a fixed rotation of the vector at position p, so the model can in principle learn to attend \"k tokens back\" with one set of weights. And no training is needed. The catch is that the pattern is added to the token vector, so position and meaning share the same numbers, and the model has to learn to untangle them."
      ],
      formula: {
        expr: "PE(pos, 2i) = sin(pos / 10000^(2i/d))          PE(pos, 2i+1) = cos(pos / 10000^(2i/d))",
        symbols: [
          { sym: "pos", meaning: "the token's position, 0, 1, 2, …" },
          { sym: "i", meaning: "the index of the dimension pair, 0 … d/2 − 1" },
          { sym: "d", meaning: "the vector width (512 in the original Transformer)" },
        ],
        example: "Position 1, pair 0: sin(1) = 0.841 and cos(1) = 0.540, the second row of the table.",
      },
      lab: { view: "positional", label: "Sinusoidal & RoPE", task: "Move the position slider and watch the barcode. Which columns change quickly and which barely move? Then try the RoPE panel." },
    },
    {
      heading: "Learned positions: what GPT-2 found",
      paragraphs: [
        "GPT-2 (and BERT) skip the formula and learn a position table: 1,024 rows for GPT-2, one per position, added to the token vectors exactly like a second embedding table. It's simpler, and the model can shape the positions however training finds useful.",
        "And what it finds is striking. In GPT-2's real table, vectors one position apart have a cosine similarity of 0.997, eight apart 0.99, sixty-four apart 0.73, and at 256 apart the similarity turns negative (−0.45). Training rediscovered a smooth, wave-like pattern, much like the hand-designed sinusoids. The weakness is the hard limit: GPT-2 has no row for position 1,025, so it simply can't read longer inputs. That limit, and the wish to extend context cheaply, is a big part of why newer models moved to RoPE.",
      ],
      lab: { view: "learned-pos", label: "GPT-2 positions", task: "Read how similarity falls with distance in GPT-2's real position table. Where does it turn negative? What would that mean for a model reading token 1,500?" },
    },
    {
      heading: "RoPE: rotate by position, compare by distance",
      paragraphs: [
        "Rotary position embedding (Su et al. 2021) takes a different route. It leaves the token vectors alone and works inside attention: before comparing a query with a key, it splits each into pairs of numbers and rotates every pair by an angle proportional to the token's position, using the same frequency ladder as the sinusoids.",
        "Why rotate? Because of a neat geometric fact. When you take the dot product of a query rotated by angle mθ and a key rotated by angle nθ, the result depends only on the *difference* (m − n)θ. So the attention score between two tokens depends on their contents and on how far apart they are, never on where they sit in absolute terms. In the worked example, positions (5, 2), (105, 102) and (3, 0) all give exactly −0.1164. Rotations also never change a vector's length, so RoPE adds position without distorting what the vector says.",
        "That relative behaviour is why RoPE became the standard in open models, and why context can be stretched after training by adjusting the rotation frequencies (a family of tricks with names like position interpolation and YaRN, covered in Module 04). In code, look for `rotary_emb` or `apply_rotary_pos_emb` in Hugging Face's Llama implementation: it's a handful of lines, applied to queries and keys only, never to values.",
      ],
      formula: {
        expr: "RoPE(x, m)[2i, 2i+1] = rotate(x[2i], x[2i+1]) by m · θᵢ,   θᵢ = 10000^(−2i/d)          RoPE(q, m) · RoPE(k, n) = f(q, k, m − n)",
        symbols: [
          { sym: "m, n", meaning: "the positions of the query and the key" },
          { sym: "θᵢ", meaning: "the rotation speed of pair i, fast for the first pairs, slow for the last" },
          { sym: "f(q, k, m − n)", meaning: "a score that depends on the vectors and their distance only" },
        ],
        example: "q at 5 and k at 2, or q at 105 and k at 102: the same distance 3, the same score −0.1164.",
      },
      mistake: "Thinking RoPE adds a position vector to the token embedding, like sinusoids. It rotates queries and keys inside every attention layer, and values are never rotated.",
      lab: { view: "rope-relative", label: "RoPE rotation", task: "Move the query and key positions together, keeping the gap fixed: does the score change? Now change only the gap. Watch the first pair's arrows rotate." },
    },
  ],
  guided:
    "Predict whether shuffling the tokens changes attention's outputs, then check in **Shuffle test**. In **RoPE rotation**, find two different pairs of positions that give exactly the same score.",
  build: {
    id: "m03-positional",
    title: "Build sinusoidal positions and RoPE, and prove attention needs them",
    packages: ["numpy"],
    data: "m03",
    parts: [
      part("positional", "p1", "Write the original Transformer's sinusoidal position vector for any position.", [
        "`i = np.arange(d)`; the angle is `pos / 10000 ** (2 * (i // 2) / d)`.",
        "`np.where(i % 2 == 0, np.sin(angle), np.cos(angle))` picks sine for even dimensions and cosine for odd.",
      ]),
      part("positional", "p2", "Implement RoPE and confirm that rotated scores depend only on the distance between positions.", [
        "`theta = pos * 10000.0 ** (-2 * np.arange(d // 2) / d)`, then rotate pairs: even' = even·cos − odd·sin, odd' = even·sin + odd·cos.",
        "`x[0::2]` and `x[1::2]` give the first and second number of every pair.",
      ]),
      part("positional", "p3", "Show that attention without positions is order-blind, and that adding position vectors breaks the symmetry.", [
        "Order-blind means `np.allclose(attend(X[perm]), attend(X)[perm])`.",
        "`with_positions` is one addition: `X + P[:len(X)]`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m03-pos-why",
      prompt: "You shuffle the tokens of a sentence and run attention with no position information. What happens to the outputs?",
      options: ["They are all different", "They are shuffled the same way, otherwise unchanged", "They all become equal", "Attention refuses to run"],
      correctIndex: 1,
      explanation: "Attention only compares vectors, so it is permutation-equivariant: shuffling the input shuffles the output. Position information is what breaks this.",
    },
    {
      id: "m03-pos-rope",
      prompt: "With RoPE, a query at position 105 and a key at 102 score the same as a query at 5 and a key at 2. Why?",
      options: [
        "RoPE ignores positions above 100",
        "Rotating both by their positions leaves a score that depends only on their distance, 3 in both cases",
        "Both pairs are the same tokens by coincidence",
        "RoPE adds the same vector to every position",
      ],
      correctIndex: 1,
      explanation: "The dot product of vectors rotated by mθ and nθ depends on (m − n)θ only, so RoPE gives relative positions.",
    },
  ],
  oneSentence:
    "Attention on its own can't see word order, so models add position: fixed sinusoids (the original Transformer), a learned table (GPT-2, limited to 1,024 positions), or RoPE, which rotates queries and keys so that scores depend on the distance between tokens.",
  deeper: [
    {
      label: "Su et al. 2021, RoFormer (RoPE)",
      url: "https://arxiv.org/abs/2104.09864",
      adds: "The rotary position embedding paper, with the proof that rotated dot products depend only on relative position.",
    },
    {
      label: "EleutherAI: Rotary Embeddings, a relative revolution",
      url: "https://blog.eleuther.ai/rotary-embeddings/",
      adds: "An accessible explanation of RoPE with diagrams, and experiments comparing it with learned positions.",
    },
    {
      label: "Vaswani et al. 2017, §3.5",
      url: "https://arxiv.org/abs/1706.03762",
      adds: "The original sinusoidal encoding and the reasoning behind its choice of frequencies.",
    },
  ],
};
