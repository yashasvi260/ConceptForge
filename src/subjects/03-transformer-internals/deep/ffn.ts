import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const ffn: DeepLesson = {
  why: [
    "Attention moves information *between* tokens. But once ` loan` has gathered what it needs from ` bank` and ` approved`, something has to *do* something with it: combine the pieces, recognise a pattern, recall a fact. That's the job of the second sub-layer in every block, the **feed-forward network** (FFN). It's a small, ordinary neural network, applied to every token separately, with no communication between tokens at all.",
    "Don't be fooled by \"small\". In step 1 you counted where a block's parameters live: two-thirds of a GPT-2 block and over 80% of a Llama 3 block are in the feed-forward network. If attention is how tokens talk to each other, the feed-forward network is where most of the model's stored knowledge appears to live; researchers have found individual hidden units that respond to specific patterns and push the prediction towards specific words.",
    "The recipe is simple: widen each token's vector (to 3,072 numbers in GPT-2 small, 4× its width), bend it with a non-linear **activation** function, and narrow it back. In this step you'll compare the activations real models use (ReLU, GELU, SiLU), measure how few of GPT-2's 3,072 hidden units are clearly active on a real sentence, build both GPT-2's and Llama's versions, and work out why Llama 3's network has a strange width of 14,336.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's start with the bend. Here are three activation functions at a few inputs. ReLU cuts every negative number to 0; GELU and SiLU are smooth versions that let small negative values through:",
    },
    {
      kind: "table",
      caption: "Activation functions at a few inputs",
      columns: ["x", "ReLU", "GELU", "SiLU"],
      rows: [
        [-3, 0, -0.004, -0.142],
        [-1, 0, -0.159, -0.269],
        [-0.5, 0, -0.154, -0.189],
        [0, 0, 0, 0],
        [0.5, 0.5, 0.346, 0.311],
        [1, 1, 0.841, 0.731],
        [3, 3, 2.996, 2.858],
      ],
      source: "worked/ffn.py",
    },
    {
      kind: "text",
      text: "Now the sizes in real models. GPT-2 and GPT-3 widen to exactly 4× and use two matrices; Llama 3 widens to 3.5× but uses three:",
    },
    {
      kind: "table",
      caption: "Feed-forward networks in real models",
      columns: ["model", "d_model", "hidden width", "× d_model", "matrices", "parameters per block"],
      rows: [
        ["GPT-2 small", 768, 3072, 4, 2, 4718592],
        ["Llama 3 8B", 4096, 14336, 3.5, 3, 176160768],
        ["GPT-3 175B", 12288, 49152, 4, 2, 1207959552],
      ],
      source: "worked/ffn.py",
    },
    {
      kind: "text",
      text: "Finally, a real measurement. Run GPT-2 on `The bank approved the loan because the customer had a steady income` and look at the 3,072 values after GELU, for every token: what share are clearly active (above 0.1), and what share are negative?",
    },
    {
      kind: "table",
      caption: "How many of GPT-2's 3,072 hidden units are active (real)",
      columns: ["block", "share above 0.1", "share below 0"],
      rows: [
        [1, 0.094, 0.861],
        [2, 0.137, 0.746],
        [6, 0.106, 0.839],
        [9, 0.094, 0.857],
        [12, 0.122, 0.83],
      ],
      source: "worked/ffn.py",
    },
  ],
  concept: [
    {
      heading: "Widen, bend, narrow",
      paragraphs: [
        "A feed-forward network is two matrix products with an activation in between. The first matrix widens each token's vector from d to a hidden width f (768 → 3,072 in GPT-2 small), the activation bends every one of those 3,072 numbers, and the second matrix narrows the result back to d, ready to be added to the residual stream. In code it's three lines: `h = act(x @ W1 + b1)`, `out = h @ W2 + b2`, `x = x + out`.",
        "Two properties are worth holding on to. First, it works on each token separately: the same matrices are applied to every position, and token 3's result never depends on token 5. All mixing between tokens happens in attention. Part 2 checks this directly, running the network on the whole sentence and on each token alone. Second, the activation is essential. Without it, two matrix products in a row collapse into one (W1 W2 is just another matrix), and the network could only compute straight-line functions of its input, however wide it was.",
      ],
      formula: {
        expr: "FFN(x) = act(x W₁ + b₁) W₂ + b₂          (W₁: d × f,  W₂: f × d,  f = 4d in GPT-2)",
        symbols: [
          { sym: "x", meaning: "one token's normalised vector, d numbers" },
          { sym: "W₁, b₁", meaning: "the widening matrix and bias, to f hidden units" },
          { sym: "act", meaning: "the activation: GELU in GPT-2, SiLU-gated (SwiGLU) in Llama" },
          { sym: "W₂, b₂", meaning: "the narrowing matrix and bias, back to d" },
        ],
        example: "GPT-2 small: 768 → 3,072 → 768, with 4,718,592 parameters per block.",
      },
      lab: { view: "ffn-shapes", label: "Widen and narrow", task: "Pick a model and follow one token's vector through the network. How wide does it get, and where are most of the parameters?" },
    },
    {
      heading: "Activation functions",
      paragraphs: [
        "Early networks used **ReLU**: keep positive numbers, set negative ones to 0. It's cheap and works, but it has a sharp corner at 0 and a hard cut-off below it. **GELU** (Hendrycks & Gimpel 2016), used by BERT and GPT-2, is a smooth version: x multiplied by the probability that a standard normal variable is below x. Large positive inputs pass almost unchanged (GELU(3) = 2.996), large negative ones go to 0, and small negative inputs dip slightly below 0 (GELU(−0.5) = −0.154). GPT-2 uses a fast tanh approximation of it.",
        "**SiLU**, also called Swish (x times the sigmoid of x), has the same shape with a slightly deeper dip. On its own it's rarely the whole story in modern models; it's the gate inside SwiGLU, the next part's topic. Why do these smooth curves win? Mostly empirical results: they train a little better than ReLU in large language models, possibly because their gradient never suddenly jumps or switches off completely.",
      ],
      lab: { view: "ffn", label: "Activation curves", task: "Compare the three curves near 0. Where do GELU and SiLU differ from ReLU? Then change the gate values in the SwiGLU panel." },
    },
    {
      heading: "Most units stay quiet",
      paragraphs: [
        "Here's what the measurement shows. For our sentence, only about 9% to 14% of the values after GELU are clearly active (above 0.1), in every block from the first to the last, and 75% to 86% are slightly negative, sitting in GELU's shallow dip. So for any given token, most of the 3,072 hidden units contribute almost nothing, and a small set does most of the work, a different set for different tokens.",
        "That pattern is the basis of a useful way to think about the feed-forward network. Geva et al. (2021) proposed reading its first matrix as a set of **keys**, each hidden unit matching a pattern in the input, and its second matrix as the corresponding **values**, each unit's contribution to the output when it fires. They found units that respond to recognisable patterns (particular phrases or topics) and whose values push up specific next tokens. That's why researchers trying to locate or edit a fact stored in a model often look first at feed-forward layers. It also explains why the network is so large: thousands of units per block, each storing something.",
      ],
      lab: { view: "ffn-active", label: "Active units", task: "Read the share of active units block by block. Does it change much between the first block and the last? What does that suggest about how the work is shared?" },
    },
    {
      heading: "SwiGLU: a gate on the hidden layer",
      paragraphs: [
        "Llama, Mistral, PaLM and most recent models replace the activation with a **gated** unit. SwiGLU (Shazeer 2020) computes two projections of the input instead of one: one is passed through SiLU and acts as a gate, the other is the content, and they're multiplied element by element before the narrowing matrix. Each hidden unit can therefore decide, from the input, how much of its content to let through. Shazeer found this gave better results than GELU for the same compute, and famously wrote that he offered no explanation, attributing their success to \"divine benevolence\".",
        "The gate costs a third matrix. To keep the parameter count equal to a 4×-wide GELU network, the hidden width is cut to two-thirds of 4d, that is 8d/3: 10,923 for d = 4,096. Llama 3 8B goes wider, to 14,336, or 3.5d, so its feed-forward network is 1.3125× the size of the GELU network it replaces; bigger networks hold more knowledge, and Meta chose to spend parameters there. Part 3 works out both numbers.",
      ],
      formula: {
        expr: "FFN_SwiGLU(x) = (SiLU(x W_gate) ⊙ (x W_up)) W_down          equal size to GELU when f = 8d / 3",
        symbols: [
          { sym: "W_gate, W_up", meaning: "two widening matrices, d × f" },
          { sym: "⊙", meaning: "element-by-element multiplication: the gate scales the content" },
          { sym: "W_down", meaning: "the narrowing matrix, f × d" },
        ],
        example: "Llama 3 8B: d = 4,096, f = 14,336, three matrices, 176,160,768 parameters per block.",
      },
      mistake: "Comparing models' feed-forward widths directly. A SwiGLU network of width f has three matrices, so it matches a GELU network of width 1.5f, not f.",
      lab: { view: "swiglu-params", label: "SwiGLU's width", task: "Move the hidden width and compare SwiGLU's three matrices with a 4× GELU network. Where are they equal? Where does Llama 3 8B sit?" },
    },
  ],
  guided:
    "Before opening **Active units**, predict what share of GPT-2's 3,072 hidden units are clearly active for a token. Then use **SwiGLU's width** to find the width at which SwiGLU and GELU networks are the same size.",
  build: {
    id: "m03-ffn",
    title: "Build GPT-2's and Llama's feed-forward networks",
    packages: ["numpy"],
    data: "m03",
    parts: [
      part("ffn", "p1", "Implement GELU (GPT-2's tanh approximation) and SiLU, and check their values.", [
        "GELU: `0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))`.",
        "SiLU: `x / (1 + np.exp(-x))`.",
      ]),
      part("ffn", "p2", "Build GPT-2's GELU network and Llama's SwiGLU network, and confirm each token is processed on its own.", [
        "GELU network: `gelu(X @ W1 + b1) @ W2 + b2`.",
        "SwiGLU network: `(silu(X @ Wg) * (X @ Wu)) @ Wd`; `*` multiplies element by element.",
      ]),
      part("ffn", "p3", "Find the SwiGLU width that matches a 4× GELU network, and how much bigger Llama 3 8B's actually is.", [
        "Set 3·d·f equal to 2·d·4d and solve for f.",
        "Divide `3 * d * ffn` by `2 * d * 4 * d`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m03-ffn-tokens",
      prompt: "How does the feed-forward network in a transformer block use the other tokens in the sentence?",
      options: [
        "It attends to all of them",
        "It doesn't: the same network is applied to each token's vector separately",
        "It averages them",
        "It only uses the previous token",
      ],
      correctIndex: 1,
      explanation: "All communication between tokens happens in attention; the feed-forward network is position-wise.",
    },
    {
      id: "m03-ffn-swiglu",
      prompt: "Why is a SwiGLU network's hidden width often about 8d/3 instead of 4d?",
      options: [
        "8d/3 is faster to compute on GPUs",
        "SwiGLU uses three matrices instead of two, so a smaller width keeps the parameter count equal to a 4d GELU network",
        "The gate halves the width",
        "Because d is always divisible by 3",
      ],
      correctIndex: 1,
      explanation: "3·d·(8d/3) = 8d² = 2·d·4d. Llama 3 8B goes wider still, to 3.5d.",
    },
  ],
  oneSentence:
    "The feed-forward network widens each token's vector, bends it with an activation (GELU in GPT-2, a SiLU-gated SwiGLU in Llama) and narrows it back, one token at a time; it holds most of each block's parameters, and only a small share of its hidden units are clearly active for any token.",
  deeper: [
    {
      label: "Geva et al. 2021, Transformer Feed-Forward Layers Are Key-Value Memories",
      url: "https://arxiv.org/abs/2012.14913",
      adds: "Reading the two matrices as keys and values, with units that detect patterns and promote next tokens.",
    },
    {
      label: "Shazeer 2020, GLU Variants Improve Transformer",
      url: "https://arxiv.org/abs/2002.05202",
      adds: "SwiGLU and its relatives, compared at equal parameter counts.",
    },
    {
      label: "Hendrycks & Gimpel 2016, GELU",
      url: "https://arxiv.org/abs/1606.08415",
      adds: "The Gaussian error linear unit and its tanh approximation.",
    },
  ],
};
