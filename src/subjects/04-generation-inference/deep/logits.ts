import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const logits: DeepLesson = {
  why: [
    "Module 03 followed a sentence up through every block of a transformer. What came out the top was one vector per token, 768 numbers each for GPT-2 small. But you never see vectors when you use a language model. You see words. Something has to turn the last vector into a choice of the next token, and that's where this module starts.",
    "The first half of that job is surprisingly simple. The model compares the final vector with every entry in its vocabulary, one dot product each, and gets one score per possible next token. Those scores are called **logits**. Softmax turns them into probabilities. Nothing has been chosen yet; you just have a distribution over 50,257 possibilities for GPT-2, or about 200,000 for GPT-4o.",
    "Why care about the details? Because almost everything you control when you call a model, temperature, top-p, the cost of long outputs, even the loss the model was trained on, is defined on this distribution. In this step you'll compute real GPT-2 logits from its real final vector, see why softmax has to be written carefully, read the distributions for four real prompts, and learn the one number that sums up how good a language model is.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's look at a real one. We gave GPT-2 small the prompt \"The capital of France is\" and read its 50,257 logits for the next token. Here are the top eight, with the probabilities softmax gives them:",
    },
    {
      kind: "table",
      caption: "GPT-2's top 8 next tokens after \"The capital of France is\"",
      columns: ["token", "logit", "probability"],
      rows: [
        ["' the'", -100.25, 0.08459],
        ["' now'", -100.818, 0.04795],
        ["' a'", -100.855, 0.04616],
        ["' France'", -101.21, 0.03238],
        ["' Paris'", -101.214, 0.03224],
        ["' in'", -101.405, 0.02664],
        ["' also'", -101.414, 0.0264],
        ["' not'", -101.517, 0.02383],
      ],
      source: "worked/logits.py",
    },
    {
      kind: "text",
      text: "Two surprises. Every logit is around −100, yet the probabilities are perfectly sensible: only the gaps between logits matter. And GPT-2 small doesn't \"know\" the answer is Paris; it ranks it fifth, at 3%, behind \" the\". Now four prompts side by side. Entropy, in bits, measures how spread out each distribution is, and the last column counts how many tokens it takes to cover 90% of the probability:",
    },
    {
      kind: "table",
      caption: "Four prompts, four shapes of distribution",
      columns: ["prompt", "top token", "its probability", "entropy (bits)", "tokens for 90%"],
      rows: [
        ["The capital of France is", "' the'", 0.08459, 8.654, 1503],
        ["The cat sat on the", "' floor'", 0.07636, 7.813, 728],
        ["Your loan application has been", "' approved'", 0.2425, 5.801, 138],
        ["My favourite thing about weekends is", "' that'", 0.27449, 5.299, 77],
      ],
      source: "worked/logits.py",
    },
  ],
  concept: [
    {
      heading: "The LM head: one dot product per vocabulary entry",
      paragraphs: [
        "After the last block (and GPT-2's final LayerNorm), each position has a vector h. To score the next token, the model multiplies h by an **output matrix** with one row per vocabulary entry. Row i is a learned vector for token i, and the logit for token i is just the dot product h · row i: large when h points the same way as that token's row. This layer is usually called the **LM head** (language-modelling head).",
        "GPT-2 doesn't even learn a separate output matrix. It reuses its token-embedding table from Module 02, the same 50,257 × 768 numbers that turned token ids into vectors at the bottom of the model. This is called **tied embeddings**, and it saves 38.6 million parameters, almost a third of GPT-2 small. Many larger models, Llama 3 8B among them, keep a separate output matrix instead; at their size the saving matters less than the flexibility.",
        "Either way the cost is real: a vocabulary of 128,000 tokens and a width of 4,096 means half a billion multiply-adds for every generated token, just for this one layer. That's one reason vocabulary size is a design choice, not a free lunch.",
      ],
      formula: {
        expr: "logits = h · Wᵀ   (W: one row per vocabulary entry)",
        symbols: [
          { sym: "h", meaning: "the final vector at the last position (768 numbers for GPT-2 small)" },
          { sym: "W", meaning: "the output matrix, vocabulary × width (50,257 × 768); GPT-2 ties it to the token embeddings" },
          { sym: "logits", meaning: "one score per vocabulary entry; higher means more likely" },
        ],
        example: "GPT-2, \"The capital of France is\": h · row(\" Paris\") = −101.214.",
      },
      lab: { view: "lm-head", label: "LM head", task: "Pick tokens and watch the dot product h · e give GPT-2's own logit. Why are all twelve scores negative, yet still in the right order?" },
    },
    {
      heading: "Softmax: only differences matter",
      paragraphs: [
        "Softmax turns logits into probabilities: exponentiate each one and divide by the total. Because of the division, adding the same number to every logit changes nothing; e^(a+c) / Σ e^(b+c) is the same as e^a / Σ e^b. That's why GPT-2's logits can all sit near −100 without any harm. What matters is the gaps: a gap of 1 is a factor of e ≈ 2.7 in probability, a gap of 2 is a factor of 7.4.",
        "The same fact tells you how to compute it safely. Computers can't hold e^(−130) in 32-bit floats; it rounds to zero, and then softmax becomes 0 ÷ 0. GPT-2's real logits after \"Your loan application has been\" are all below −130, so a naive 32-bit softmax returns nothing but NaN. The fix is to subtract the largest logit first. The biggest exponent becomes e^0 = 1, nothing overflows, and the answer is mathematically identical. Every real implementation does this.",
        "For training and for scoring text you usually want **log-probabilities**, not probabilities. Computing log(softmax(z)) is a trap, because a probability that rounds to 0 turns into −∞. Instead, compute log-softmax directly: z − max(z) − log Σ e^(z − max(z)). That's what PyTorch's log_softmax does.",
      ],
      mistake: "Thinking a logit is a probability, or that a negative logit means an unlikely token. Logits are only meaningful relative to each other: GPT-2's top token after \"The capital of France is\" has a logit of −100.25, and it's the most likely of 50,257.",
      lab: { view: "softmax-shift", label: "Shift and softmax", task: "Add a constant to every logit: do the probabilities move? Then switch to \"Your loan application has been\" and compare a naive 32-bit softmax with the subtract-the-max version." },
    },
    {
      heading: "Reading a next-token distribution",
      paragraphs: [
        "A distribution over 50,257 tokens is hard to picture, so people summarise it. The **top probability** says how sure the model is of its favourite. The **entropy**, −Σ p log₂ p, measures spread in bits: 0 bits means certain, and k bits means \"as unsure as a fair choice among 2^k tokens\". The **number of tokens needed to cover 90%** says how long the plausible list is.",
        "The four real prompts in the worked example show how different these can be. After \"My favourite thing about weekends is\", 77 tokens cover 90% of the probability and \" that\" alone has 27%. After \"The capital of France is\", it takes 1,503 tokens, because GPT-2 small sees countless ways to continue that sentence. The prompt that sounds most factual turns out to be the flattest, which is a good warning: the shape of the distribution reflects what the model has seen, not what's true.",
        "These summaries matter for the rest of the module. Decoding rules like top-k and top-p (step 3) decide how much of this list to keep, and a rule that's sensible for a 77-token distribution can be badly wrong for a 1,503-token one.",
      ],
      lab: { view: "real-next", label: "Real distributions", task: "Switch between the four prompts. Which one is most confident, and which needs the most tokens to reach 90%?" },
    },
    {
      heading: "Every position predicts, and that's the loss",
      paragraphs: [
        "The LM head runs at every position, not just the last. After each prefix of a sentence the model predicts the token that comes next. When generating you only use the last position's prediction; during training (Module 05) all of them are used at once, because the real next token is known everywhere.",
        "Scoring a prediction is simple: take the probability the model gave the token that actually came next, and compute −ln p. A confident correct guess costs nearly 0; giving the real token 1 in 10,000 costs 9.2. Average that over a text and you have the **language-modelling loss**, the number training pushes down. GPT-2 small reads \"The bank approved the loan because the customer had a steady income\" with an average loss of 4.224.",
        "Exponentiate the loss and you get **perplexity**: e^4.224 ≈ 68. You can read it as \"on average, the model was as unsure as if it were choosing fairly among 68 tokens\". Lower is better, and it's the standard way to compare language models on the same text and tokenizer. Notice where GPT-2 paid: it gave \" bank\" after \"The\" a probability of 0.0002 (what could it know?), but \" income\" after \" steady\" got 0.347.",
      ],
      formula: {
        expr: "loss = −(1/N) Σ ln p(actual next token),   perplexity = e^loss",
        symbols: [
          { sym: "p(actual next token)", meaning: "the probability the model gave the token that really came next" },
          { sym: "N", meaning: "the number of predictions (positions) averaged" },
        ],
        example: "GPT-2 on the bank sentence: loss 4.224, perplexity 68.3.",
      },
      lab: { view: "every-position", label: "Every position predicts", task: "Click through the positions of a real sentence. Where was GPT-2 right, where was it surprised, and which tokens cost it the most loss?" },
    },
  ],
  guided:
    "Before opening **Real distributions**, predict which prompt has the most confident next token: \"The capital of France is\" or \"Your loan application has been\". Then use **Every position predicts** to find the single token that cost GPT-2 the most loss.",
  build: {
    id: "m04-logits",
    title: "Compute real logits, a safe softmax and a model's perplexity",
    packages: ["numpy"],
    data: "m04",
    parts: [
      part("logits", "p1", "Reproduce GPT-2's own logits from its real final vector and 12 rows of its embedding table, and rank them.", [
        "Each logit is a dot product: `E @ h` gives all 12 at once.",
        "`np.argsort(-logits)` lists indices from the highest logit down.",
      ]),
      part("logits", "p2", "Write a softmax that survives logits of −130 or +1,000, and a log-softmax that never takes the log of 0.", [
        "Subtract `z.max()` before `np.exp`: the result is mathematically the same.",
        "log-softmax = `s - np.log(np.exp(s).sum())` with `s = z - z.max()`.",
      ]),
      part("logits", "p3", "Measure a distribution's entropy in bits, then GPT-2's real loss and perplexity on a sentence.", [
        "Drop zero entries before `p * np.log2(p)`.",
        "Loss is `-np.mean(np.log(p_actual))`; perplexity is `np.exp(loss)`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m04-logits-count",
      prompt: "GPT-2 has a vocabulary of 50,257 tokens. How many logits does it produce when predicting one next token?",
      options: ["One: the chosen token", "12, one per layer", "50,257: one score per vocabulary entry", "768, one per number in the vector"],
      correctIndex: 2,
      explanation: "The final vector is dotted with every row of the output matrix, giving one score per possible next token.",
    },
    {
      id: "m04-logits-shift",
      prompt: "GPT-2's logits after a prompt are all around −100. What happens to the probabilities if you add 100 to every logit?",
      options: ["They all become larger", "Nothing: softmax only depends on the differences between logits", "The top token becomes certain", "They no longer sum to 1"],
      correctIndex: 1,
      explanation: "e^(a+c) / Σ e^(b+c) = e^a / Σ e^b. That's also why subtracting the maximum makes softmax safe without changing it.",
    },
    {
      id: "m04-logits-perplexity",
      prompt: "A model's average loss on a text is 4.224 (natural log). What is its perplexity, and what does it mean?",
      options: [
        "4.224: it got 4 tokens wrong",
        "About 68: on average it was as unsure as a fair choice among 68 tokens",
        "About 0.015: the probability of the whole text",
        "422: the number of tokens in the text",
      ],
      correctIndex: 1,
      explanation: "Perplexity = e^loss = e^4.224 ≈ 68.3. Lower is better; it's only comparable on the same text with the same tokenizer.",
    },
  ],
  oneSentence:
    "The LM head dots the final vector with one row per vocabulary entry to get a logit for every possible next token; softmax, computed after subtracting the maximum, turns those into probabilities whose shape you can summarise by top probability, entropy and the size of the 90% set, and averaging −ln p of the real next tokens gives the loss and perplexity.",
  deeper: [
    {
      label: "Radford et al. 2019, Language Models are Unsupervised Multitask Learners (GPT-2)",
      url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
      adds: "The model these numbers come from, and how it was evaluated by perplexity.",
    },
    {
      label: "Press & Wolf 2017, Using the Output Embedding to Improve Language Models",
      url: "https://arxiv.org/abs/1608.05859",
      adds: "Why tying the input embeddings to the output matrix works.",
    },
    {
      label: "Hugging Face, Perplexity of fixed-length models",
      url: "https://huggingface.co/docs/transformers/perplexity",
      adds: "Computing perplexity in practice, including texts longer than the context window.",
    },
  ],
};
