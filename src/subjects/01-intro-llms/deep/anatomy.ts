import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const anatomy: DeepLesson = {
  why: [
    "Here's a problem you might not have noticed. A computer can only do arithmetic on numbers, and text isn't numbers. So before a model can guess anything, it has to turn `The cat sat` into numbers, do some arithmetic that somehow captures meaning, and then turn the result back into a guess about the next word. How?",
    "The counting model from the last step dodged the question. It treated each word as a label and looked it up in a table. That's exactly why it couldn't generalise: to a table, `cat` and `dog` are as different as `cat` and `.`.",
    "The answer almost every LLM uses today is the **transformer** (2017). Give every token a vector of numbers. Then let every token look at every earlier token, in one step, and pull in whatever it needs. Do that dozens of times. The parts are few, and always in the same order. Learn them once and you can read the design of GPT-2, Llama 3 or nearly any modern LLM. In this step you'll walk through every part with real numbers, play with each one, and then build a working one-block model yourself.",
  ],
  worked: [
    {
      kind: "text",
      text: "**Tokenize.** First, text becomes IDs. GPT-2's real tokenizer turns `The cat sat` into three IDs: `464`, `3797`, `3332` (` cat` and ` sat` include their leading space). To keep the arithmetic checkable by hand, we'll use a toy model with a 6-token vocabulary (`the cat sat on mat .`) and vectors of width 4, so `the cat sat` becomes IDs `0, 1, 2`.",
    },
    {
      kind: "text",
      text: "**Embed.** Next, each ID picks a row from the embedding table, a list of 4 numbers per token. That's it: no maths, just a lookup. (The numbers are hand-picked for readability; a trained model learns them.)",
    },
    {
      kind: "table",
      caption: "Step 1 · Embedding lookup (rows of the table)",
      columns: ["token", "id", "x₁", "x₂", "x₃", "x₄"],
      rows: [
        ["the", 0, 1, 0, 0, 0],
        ["cat", 1, 0, 1, 0.5, 0],
        ["sat", 2, 0, 0, 1, 0.5],
      ],
      source: "worked/anatomy.py",
    },
    {
      kind: "text",
      text: "**Attention scores.** Now the interesting part. Every token compares itself with every token it's allowed to see, using a dot product (multiply matching numbers, add them up), divided by √4 = 2. A token may only look at itself and earlier tokens (no peeking at the future), so later positions are blanked out with −∞.",
    },
    {
      kind: "math",
      text: "score(sat → cat) = (0·0 + 0·1 + 1·0.5 + 0.5·0) / 2 = 0.5 / 2 = 0.25\nscore(sat → sat) = (0·0 + 0·0 + 1·1 + 0.5·0.5) / 2 = 1.25 / 2 = 0.625",
    },
    {
      kind: "table",
      caption: "Step 2 · Attention scores, masked (row looks at column)",
      columns: ["", "the", "cat", "sat"],
      rows: [
        ["the", 0.5, "-inf", "-inf"],
        ["cat", 0, 0.625, "-inf"],
        ["sat", 0, 0.25, 0.625],
      ],
      source: "worked/anatomy.py",
    },
    {
      kind: "text",
      text: "**Softmax.** Scores aren't weights yet. Softmax turns each row into weights that are positive and add up to 1: exponentiate, then divide by the row's total. For the `sat` row: e⁰ = 1, e^0.25 = 1.284, e^0.625 = 1.868; total 4.152; weights 1/4.152 = 0.241, 1.284/4.152 = 0.309, 1.868/4.152 = 0.45.",
    },
    {
      kind: "table",
      caption: "Step 3 · Attention weights after softmax (each row adds up to 1)",
      columns: ["", "the", "cat", "sat"],
      rows: [
        ["the", 1, 0, 0],
        ["cat", 0.349, 0.651, 0],
        ["sat", 0.241, 0.309, 0.45],
      ],
      source: "worked/anatomy.py",
    },
    {
      kind: "text",
      text: "**Mix.** Each token's new vector is the weighted average of the vectors it attended to. For `sat`: 0.241 × [1, 0, 0, 0] + 0.309 × [0, 1, 0.5, 0] + 0.45 × [0, 0, 1, 0.5] = [0.241, 0.309, 0.605, 0.225]. See what happened? `sat` now carries a little of `the` and `cat`. That's how context gets in.",
    },
    {
      kind: "table",
      caption: "Step 4 · Mixed vectors (weights × vectors)",
      columns: ["token", "x₁", "x₂", "x₃", "x₄"],
      rows: [
        ["the", 1, 0, 0, 0],
        ["cat", 0.349, 0.651, 0.326, 0],
        ["sat", 0.241, 0.309, 0.605, 0.225],
      ],
      source: "worked/anatomy.py",
    },
    {
      kind: "text",
      text: "**Output head.** Last step: turn the final vector into a guess. Score every vocabulary token by the dot product of its embedding row with the last position's vector (these scores are called **logits**), then softmax them into probabilities. For `mat`: 0·0.241 + 0.9·0.309 + 0.4·0.605 + 0.1·0.225 = 0.543.",
    },
    {
      kind: "table",
      caption: "Step 5 · Next-token probabilities after “the cat sat”",
      columns: ["candidate", "logit", "probability"],
      rows: [
        ["the", 0.241, 0.132],
        ["cat", 0.612, 0.192],
        ["sat", 0.717, 0.213],
        ["on", 0.345, 0.147],
        ["mat", 0.543, 0.179],
        [".", 0.276, 0.137],
      ],
      source: "worked/anatomy.py",
    },
    {
      kind: "text",
      text: "So the toy thinks `sat` comes next (0.213) after `the cat sat`. Wrong English! But that's expected: nothing has been learned yet. **Training** (two steps on) adjusts every number in the embedding table and the layers until `on` gets the top score here. The pipeline itself (look up, attend, mix, score, softmax) is exactly what a trained model runs.",
    },
  ],
  concept: [
    {
      heading: "The pipeline in one line",
      paragraphs: [
        "Every GPT-style model is the same short pipeline: **tokenizer → embedding table → N transformer blocks → output head → softmax**. Text goes in one end; a probability for every vocabulary token comes out the other.",
        "Getting lost in the details? Follow the **shapes**. They're the easiest way to keep your bearings. Say the prompt has T tokens and the model has width d. The token IDs are T numbers. After the embedding table, they're a T × d grid, one vector per token. Every transformer block takes a T × d grid and hands back a T × d grid, same shape. Finally, the output head turns the last row into V scores, one per vocabulary token. In GPT-2 small, d = 768 and V = 50,257.",
      ],
      lab: {
        view: "anatomy",
        label: "Pipeline",
        task: "Click each part of GPT-2 small. Which part has the most learned numbers, the embedding table or one transformer block? And how many does the tokenizer have?",
      },
    },
    {
      heading: "Tokenizer and embedding table",
      paragraphs: [
        "The **tokenizer** comes first, and here's something that surprises people: it isn't learned during training at all. It's a fixed lookup, built before training, that splits text into tokens and gives each one an integer ID. No weights, so it adds nothing to the parameter count. Module 02 shows how it's built.",
        "The **embedding table** is a matrix with V rows and d columns. Row i is the vector for token i. Looking up a token just means taking its row. No multiplication at all! But unlike the tokenizer, the table *is* learned: training slowly moves the rows so that tokens used in similar ways end up with similar vectors.",
      ],
      formula: {
        expr: "X = E[ids]      E ∈ ℝ^(V×d),  X ∈ ℝ^(T×d)",
        symbols: [
          { sym: "E", meaning: "the embedding table: V rows, d numbers each" },
          { sym: "ids", meaning: "the T token IDs from the tokenizer" },
          { sym: "X", meaning: "one vector per input token, stacked into a T × d grid" },
        ],
        example: "In the worked example V = 6, d = 4, ids = [0, 1, 2], so X is the 3 × 4 grid in Step 1.",
      },
      lab: {
        view: "token-lookup",
        label: "Token lookup",
        task: "Type a sentence and watch GPT-2's real tokenizer turn it into IDs. Try `unbelievable` and an emoji. How many rows of the table does each need?",
      },
    },
    {
      heading: "Position information",
      paragraphs: [
        "Quick question: does attention, as you just computed it, know the order of the words? Think about it before reading on.",
        "It doesn't! Attention treats its inputs as a set. Shuffle the tokens and each one gets exactly the same scores with the same partners. But `Dog bites man` and `Man bites dog` had better mean different things. So the model also needs to know **where** each token sits.",
        "GPT-2 solves this with a second learned table: 1,024 position vectors, one per position in its context window, added to the token vectors. Llama-style models do something cleverer called RoPE: they rotate the query and key vectors by an angle that depends on the position. Either way, afterwards each vector carries both *what* the token is and *where* it is. (Our toy skipped this to keep the numbers readable.)",
      ],
      mistake:
        "Assuming the model reads left to right like a person and so knows word order automatically. The arithmetic of attention has no built-in sense of order; without position information `Dog bites man` and `Man bites dog` produce the same set of vectors.",
      lab: {
        view: "positions",
        label: "Word order",
        task: "Compare what attention sees for `dog bites man` and `man bites dog`. Now switch on position information. What changed, and why does it matter?",
      },
    },
    {
      heading: "Inside a transformer block: attention",
      paragraphs: [
        "A **transformer block** has two halves. The first half is **attention**, which you've already done by hand: each token scores the tokens it may see, softmax turns the scores into weights, and the token takes a weighted mix of their vectors.",
        "In a trained model those weights become meaningful. Take `The animal didn't cross the street because it was tired`. When the model processes `it`, attention can pull most of its weight from `animal`. That's how the model works out what `it` refers to.",
        "Real attention adds three learned matrices. Each token's vector becomes a **query** (what am I looking for?), a **key** (what do I offer?) and a **value** (what do I hand over if I'm chosen?). Scores are query · key, and the mix is over values. Models also run several of these side by side, called **heads**, each free to look for something different. Our toy used the raw vectors for all three roles, which is why you can check its numbers by hand. Module 03 adds the matrices and the heads.",
        "And those −∞ entries? That's the **causal mask**, and it's what makes the model *generative*. Position t can only see positions 1 to t. During training, this lets the model learn to predict every position's next token at once, without cheating by looking at the answer.",
      ],
      formula: {
        expr: "Attention(Q, K, V) = softmax(Q·Kᵀ / √d + mask) · V",
        symbols: [
          { sym: "Q, K, V", meaning: "queries, keys and values: the input vectors times three learned matrices (the toy used X for all three)" },
          { sym: "Q·Kᵀ", meaning: "a T × T grid of scores: row i, column j says how well token i matches token j" },
          { sym: "√d", meaning: "divides scores down so softmax doesn't become all-or-nothing when d is large" },
          { sym: "mask", meaning: "−∞ above the diagonal, so no token sees a later one" },
        ],
        example: "Row `sat` of Step 2: scores 0, 0.25, 0.625 → softmax → weights 0.241, 0.309, 0.45 → mix → [0.241, 0.309, 0.605, 0.225].",
      },
      lab: {
        view: "attention",
        label: "Attention",
        task: "Pick `sat` and check the weights against the worked example. Now switch off the causal mask and pick `the`. What can it suddenly see, and why would that be cheating during training?",
      },
    },
    {
      heading: "Inside a transformer block: feed-forward, residuals, normalisation",
      paragraphs: [
        "The second half of the block is a **feed-forward network** (FFN): the same small two-layer network, applied to each token's vector on its own. It widens the vector (GPT-2: 768 → 3,072), applies a non-linear function, and narrows it back (3,072 → 768). Here's a useful way to think about the two halves: attention moves information *between* tokens; the FFN processes information *within* each token. The FFN also holds about two thirds of each block's weights.",
        "Two more pieces of plumbing make deep stacks of blocks actually trainable. First, **residual connections**: each half *adds* its result to its input (X = X + Attention(X), then X = X + FFN(X)) instead of replacing it. So information, and training signals, can flow straight through dozens of blocks. Second, **normalisation** (LayerNorm in GPT-2, RMSNorm in Llama) rescales each vector before each half, so the numbers stay in a sensible range however deep the stack gets.",
      ],
      formula: {
        expr: "X ← X + Attention(Norm(X))\nX ← X + FFN(Norm(X))      FFN(x) = W₂ · act(W₁ · x)",
        symbols: [
          { sym: "Norm", meaning: "LayerNorm or RMSNorm: rescales each vector" },
          { sym: "W₁, W₂", meaning: "the FFN's two learned matrices (d → 4d → d in GPT-2)" },
          { sym: "act", meaning: "a non-linear function such as GELU or ReLU (ReLU(z) = max(0, z))" },
          { sym: "X + …", meaning: "the residual connection: keep the input, add the change" },
        ],
        example: "If attention's output for `sat` is [0.241, 0.309, 0.605, 0.225], the residual gives [0, 0, 1, 0.5] + [0.241, 0.309, 0.605, 0.225] = [0.241, 0.309, 1.605, 0.725] before the FFN.",
      },
      lab: {
        view: "norm-residual",
        label: "Norm & residual",
        task: "Multiply the whole vector by 50. Which rows change and which stay put? Then make one number huge and see what LayerNorm does with it.",
      },
    },
    {
      heading: "The stack and the output head",
      paragraphs: [
        "A model is just N of these blocks in a row: 12 in GPT-2 small, 32 in Llama 3 8B, 96 in GPT-3. Each block refines every token's vector using everything before it. And each block has its own weights; they're not shared.",
        "After the last block comes the **output head**. It turns the final position's vector into V scores, called **logits**, with one matrix multiplication, and softmax turns those into probabilities. GPT-2 reuses its embedding table for this (**tied** weights), which is exactly what the worked example did: score = embedding row · final vector. Llama 3 uses a separate matrix.",
        "One subtle point: only the last position matters for choosing the next token, but the model computes outputs at *every* position. Why bother? Because training uses them all, one prediction per position.",
      ],
      formula: {
        expr: "logits = h_T · Eᵀ        p = softmax(logits)",
        symbols: [
          { sym: "h_T", meaning: "the final vector at the last position (length d)" },
          { sym: "Eᵀ", meaning: "the embedding table turned on its side (tied head), giving V scores" },
          { sym: "p", meaning: "the probability of each of the V tokens coming next" },
        ],
        example: "Step 5: h_T = [0.241, 0.309, 0.605, 0.225]; for `mat` the logit is 0.543; softmax over all six logits gives p(mat) = 0.179.",
      },
      lab: {
        view: "logits",
        label: "Logits",
        task: "These are gemma4's real scores. Add 3 to every score: do the probabilities move? Now multiply the scores by 0.5. Which familiar setting does that behave like?",
      },
    },
  ],
  guided:
    "Before you click anything, predict: which part of GPT-2 small has the most learned numbers, the embedding table or one transformer block? Check in the **Pipeline** lab. Then type your own sentence into **Token lookup** and follow its IDs into the table.",
  build: {
    id: "01-anatomy-forward",
    title: "Build a one-block transformer in NumPy",
    packages: ["numpy"],
    parts: [
      part("anatomy", "p1", "Write the two building blocks: `embed(E, ids)` (the lookup) and `softmax(x)` (rows that add up to 1, without overflow).", [
        "NumPy lets you index with a list: `E[[5, 0, 5]]` returns three rows.",
        "`z = np.exp(x - x.max(axis=-1, keepdims=True))`, then `z / z.sum(axis=-1, keepdims=True)`.",
      ]),
      part("anatomy", "p2", "Write `causal_attention(X)`: scores, causal mask, softmax, mix. Your weights must match Step 3 of the worked example.", [
        "Scores are `X @ X.T / np.sqrt(d)`.",
        "`np.where(mask, -np.inf, scores)` blanks out later positions; softmax turns −∞ into exactly 0.",
      ]),
      part("anatomy", "p3", "Put it together in `forward(E, ids, W1, W2)`: embed → residual attention → residual feed-forward → logits against every embedding row → softmax.", [
        "Each residual is `X = X + something(X)`.",
        "Use the **last** row: `logits = X[-1] @ E.T` gives one score per vocabulary token.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "an-vocab",
      prompt: "You double the vocabulary size of a model but keep everything else the same. Which parts get more weights?",
      options: [
        "Every transformer block",
        "Only the embedding table (and the output head, if it is a separate matrix)",
        "Only the attention layers",
        "Nothing, because the vocabulary is part of the tokenizer",
      ],
      correctIndex: 1,
      explanation:
        "The vocabulary size V sets the number of rows in the embedding table and the number of outputs of the head. The blocks only see d-wide vectors, so their size doesn't depend on V.",
    },
    {
      id: "an-mask",
      prompt: "What would go wrong if you trained a generative model without the causal mask?",
      options: [
        "Nothing, it would just be slower",
        "Each position could see the very token it is supposed to predict, so it would learn to copy instead of predict, and fail when generating",
        "The model would have more parameters",
        "Softmax would no longer add up to 1",
      ],
      correctIndex: 1,
      explanation:
        "Training predicts every position's next token at once. Without the mask, position t can see token t+1, the answer. Generation has no future tokens to peek at, so the copied skill is useless.",
    },
    {
      id: "an-residual",
      prompt: "In `X = X + FFN(X)`, what does the `X +` part buy you?",
      options: [
        "It doubles the model's vocabulary",
        "The block only has to learn a change to the vector, and information and training signals can pass straight through many blocks",
        "It makes the model causal",
        "It normalises the vector",
      ],
      correctIndex: 1,
      explanation:
        "That's the residual connection. Without it, stacking dozens of blocks makes training unstable. With it, each block refines the vector rather than rebuilding it.",
    },
  ],
  oneSentence:
    "Tokens become rows of an embedding table, N blocks of attention (mixing between tokens) and feed-forward (processing within a token) refine those vectors, and the output head scores every vocabulary token for the next position.",
  deeper: [
    { label: "Vaswani et al. 2017, Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", adds: "The original transformer; §3.2 defines scaled dot-product attention exactly as in the formula above." },
    { label: "Radford et al. 2019, GPT-2 paper", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", adds: "§2.3 lists the decoder-only changes (pre-normalisation, sizes) used by GPT-style models." },
    { label: "Jay Alammar, The Illustrated Transformer", url: "https://jalammar.github.io/illustrated-transformer/", adds: "Step-by-step pictures of queries, keys, values and heads, the part this toy simplified." },
  ],
};
