import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const recap: DeepLesson = {
  why: [
    "You have now met every idea an LLM is built from, one at a time: tokens, next-token probabilities, the generation loop, embeddings, attention and context, the three architecture families, training by gradient descent, pre-training and fine-tuning. Separately, each is simple. The point of this last step is to put them back together so the whole picture sticks, and to prove to yourself that you can build it.",
    "So this step is a small project rather than a new concept. You will build a complete (tiny) language model end to end: a tokenizer, a trained model that never gives zero probability, a generation loop with temperature, and an evaluation that measures how surprised the model is by text it has never seen, before and after fine-tuning it on banking text. It is the same pipeline as a real LLM with each part shrunk to a few lines. Wherever your model is limited, the rest of the course is the upgrade.",
    "Read the concept sections as a map: each one names a part of the mini-project, the real-model version of that part, and the module where you'll build the real thing.",
  ],
  worked: [
    {
      kind: "text",
      text: "Here is what the finished mini-project produces. The model is pre-trained on 39 tokens of general text, then fine-tuned on 30 tokens of banking text. **Perplexity** (introduced below) measures surprise on held-out banking sentences it has never seen. With a 25-token vocabulary, a model that knows nothing scores exactly 25.",
    },
    {
      kind: "table",
      caption: "The mini-project's model in numbers",
      columns: ["measure", "pre-trained", "after fine-tuning"],
      rows: [
        ["vocabulary size", 25, 25],
        ["training tokens", 39, 69],
        ["P(cat | the), smoothed", 0.0833, 0.0652],
        ["P(loan | the), smoothed", 0.0278, 0.0652],
        ["perplexity on held-out banking text", 25.07, 12.89],
      ],
      source: "worked/recap.py",
    },
    {
      kind: "math",
      text: "P(cat | the)  = (count + 1) / (total after `the` + V) = (2 + 1) / (11 + 25) = 3 / 36 = 0.0833\nP(loan | the) = (0 + 1) / (11 + 25) = 1 / 36 = 0.0278      (never seen, yet not zero)",
    },
    {
      kind: "text",
      text: "Before fine-tuning, the model is barely better than guessing on banking text (perplexity 25.07 against a guess-everything 25). After 30 tokens of banking text, perplexity halves to 12.89: it is about as uncertain as choosing among 13 equally likely tokens instead of 25. That is a real, measured improvement from fine-tuning, the same measurement labs use on real LLMs.",
    },
  ],
  concept: [
    {
      heading: "Part 1 · Tokenizer: text in, tokens out",
      paragraphs: [
        "Your `tokenize` lowercases text and splits it into words and punctuation marks. A real tokenizer does the same job, mapping text to a fixed vocabulary of IDs, but splits into sub-word pieces learned from data (byte-pair encoding), so it never meets an unknown word: `unbelievable` becomes pieces it knows. Vocabulary size is a design choice that trades sequence length against table size. **Module 02** builds byte-pair encoding and runs the real GPT tokenizers.",
      ],
    },
    {
      heading: "Part 2 · Model: probabilities that are never zero",
      paragraphs: [
        "Your `train` counts bigrams and your `prob` applies **add-one smoothing**: pretend every possible pair was seen once more than it was. That fixes step 1's fatal flaw, since unseen pairs now get a small probability instead of zero, but the model still sees only one previous token and still treats `cat` and `dog` as unrelated.",
        "The real version replaces counting with the transformer from the anatomy step: an embedding table so similar tokens share structure, attention so every token can use the whole context, a stack of blocks, and an output head with softmax. Its probabilities are never zero either, because softmax is always positive. **Module 03** builds the transformer's internals: attention heads, the feed-forward network, normalisation and positions.",
      ],
      formula: {
        expr: "P(b | a) = (count(a → b) + 1) / (count(a → anything) + V)",
        symbols: [
          { sym: "count(a → b)", meaning: "how often b followed a in the training text" },
          { sym: "V", meaning: "the vocabulary size: one pretend count for every possible next token" },
        ],
        example: "P(cat | the) = (2 + 1) / (11 + 25) = 0.0833; P(loan | the) = (0 + 1) / 36 = 0.0278.",
      },
    },
    {
      heading: "Part 3 · Generation: the loop, with temperature",
      paragraphs: [
        "Your `generate` is the generation loop: compute the probabilities for the next token, choose one, append, repeat. With temperature 0 it is greedy (always the top token, repeatable); with temperature above 0 it samples from probabilities raised to the power 1 / T. T below 1 sharpens the distribution towards the top choices; above 1 flattens it so rarer tokens appear. Every LLM API exposes exactly this setting.",
        "The real loop adds two things you'll meet later. **Top-k and top-p** sampling cut off the long tail of unlikely tokens before sampling (Module 03 lets you try them on a real model). **The KV cache** stores each token's keys and values so the model doesn't recompute the whole context for every new token (Part IV).",
      ],
      formula: {
        expr: "P_T(w) ∝ P(w)^(1/T)",
        symbols: [
          { sym: "T", meaning: "the temperature; T → 0 approaches greedy, T = 1 leaves the distribution unchanged" },
          { sym: "∝", meaning: "proportional to: rescale so the values add up to 1" },
        ],
        example: "Two tokens with P = 0.6 and 0.4: at T = 0.5 they become 0.36 and 0.16, i.e. 0.69 and 0.31 after rescaling; at T = 2 they become 0.775 and 0.632, i.e. 0.55 and 0.45.",
      },
    },
    {
      heading: "Part 4 · Evaluation: perplexity",
      paragraphs: [
        "Your `perplexity` is the standard measure of a language model: take the average cross-entropy (the training loss from the training step) on text the model did *not* train on, and exponentiate it. The result reads as an effective number of choices: perplexity 13 means the model is, on average, as uncertain as if it were picking uniformly among 13 tokens. Lower is better. A model that knows nothing has perplexity equal to the vocabulary size.",
        "Measuring on **held-out** text is essential. On its own training text a model can look excellent simply by memorising; only unseen text shows whether it learned patterns that generalise. Real evaluations of LLMs add task benchmarks (accuracy on questions, code that passes tests), but perplexity on held-out text remains the basic health check during training.",
      ],
      formula: {
        expr: "perplexity = exp( −(1/N) · Σᵢ ln P(xᵢ₊₁ | xᵢ) )",
        symbols: [
          { sym: "N", meaning: "the number of predicted tokens in the held-out text" },
          { sym: "ln P(…)", meaning: "the log-probability the model gave each actual next token" },
          { sym: "exp", meaning: "turns the average loss back into an \"effective number of choices\"" },
        ],
        example: "A model that gives every one of 25 tokens 1/25 has loss ln 25 and perplexity exactly 25. The mini-project's pre-trained model scores 25.07 on banking text; after fine-tuning, 12.89.",
      },
      mistake:
        "Reporting perplexity on the training text, or comparing perplexities between models with different tokenizers. The first rewards memorising; the second compares different units (a model that splits text into more, smaller tokens has an easier job per token). Compare on the same held-out text and the same tokenizer.",
    },
    {
      heading: "Your model next to a real one",
      paragraphs: [
        "Put the numbers side by side and the shape of the upgrade is clear. Your vocabulary has 25 tokens; Llama 3's has 128,256. Your model sees 1 previous token; Llama 3 8B sees up to 8,192. Your model's “parameters” are at most 25 × 25 = 625 counts; Llama 3 8B has 8,030,261,248 learned weights. You trained on 69 tokens; it trained on over 15 trillion.",
        "Yet the interface is identical: tokens in, a probability for every possible next token out, a loop that samples and appends, and perplexity on held-out text to tell whether it is any good. Everything that makes an LLM impressive lives inside the `prob` function, which is exactly the part the rest of the course opens up.",
      ],
    },
    {
      heading: "Fine-tuning, and where it all leads",
      paragraphs: [
        "Your fine-tuning was continued counting on banking text, and perplexity on unseen banking text halved. Real fine-tuning is continued gradient descent, and the measurement is the same. Everything you built connects forward. **Part II** (Modules 04–09) uses pretrained models for classification, clustering, prompting, agents, retrieval and images, with inference only. **Part III** fine-tunes them properly: full fine-tuning, LoRA, instruction and preference tuning. **Part IV** serves them: quantisation, batching, caching, evaluation and safety in production.",
        "If you can explain each of the four parts of your mini-project and name what replaces it in a real LLM, you have the map this module set out to give you.",
      ],
    },
  ],
  guided:
    "Before you build: for each line in the summary below, name the mini-project part that implements a tiny version of it. Then check where Module 02 picks up.",
  build: {
    id: "01-mini-project",
    title: "Mini-project: build a tiny language model end to end",
    packages: [],
    parts: [
      part("recap", "p1", "**Tokenizer.** Write `tokenize(text)`: lowercase, words and the punctuation marks `. , ! ?` as separate tokens.", [
        "`re.findall(pattern, text.lower())` returns every match.",
        "One pattern for both: `[a-z']+|[.,!?]` (a word, or one punctuation mark).",
      ]),
      part("recap", "p2", "**Model.** Write `prob(counts, vocab, prev, nxt)` with add-one smoothing, so no next token ever gets probability 0.", [
        "`followers = counts.get(prev, {})` works even for a `prev` never seen.",
        "`(followers.get(nxt, 0) + 1) / (sum(followers.values()) + len(vocab))`.",
      ]),
      part("recap", "p3", "**Generation.** Finish `generate(...)`: greedy at temperature 0, otherwise sample with probabilities raised to 1 / temperature.", [
        "Greedy: `vocab[p.index(max(p))]`.",
        "Sampling: `rng.choices(vocab, [x ** (1 / temperature) for x in p])[0]`.",
      ]),
      part("recap", "p4", "**Evaluation.** Write `perplexity(counts, vocab, tokens)` and show that fine-tuning on banking text lowers perplexity on unseen banking text (25.07 → 12.89).", [
        "Loss per pair: `-math.log(prob(counts, vocab, a, b))`.",
        "Perplexity is `math.exp` of the average loss.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "rc-perplexity",
      prompt: "A model scores perplexity 4 on held-out text. What does that mean?",
      options: [
        "It gets 4% of tokens right",
        "On average it is as uncertain as if choosing uniformly among 4 tokens",
        "It has 4 layers",
        "It needs 4 seconds per token",
      ],
      correctIndex: 1,
      explanation: "Perplexity is exp(average cross-entropy), an effective number of equally likely choices per token. Lower means more confident and correct predictions.",
    },
    {
      id: "rc-map",
      prompt: "Which pairing of mini-project part and real-LLM part is right?",
      options: [
        "Smoothed bigram counts ↔ the tokenizer",
        "Smoothed bigram counts ↔ embedding table + transformer blocks + output head",
        "Perplexity ↔ attention",
        "Temperature ↔ the embedding table",
      ],
      correctIndex: 1,
      explanation: "The counts are the toy's whole model: they turn a context into next-token probabilities, which is the job of the embeddings, blocks and output head in a real LLM. The tokenizer, sampling and evaluation map across directly.",
    },
  ],
  oneSentence:
    "An LLM is a tokenizer, a model that turns context into next-token probabilities, a sampling loop that writes one token at a time, and a held-out evaluation, and you have now built a tiny version of every one.",
  deeper: [
    { label: "Jurafsky & Martin, Speech and Language Processing, ch. 3", url: "https://web.stanford.edu/~jurafsky/slp3/3.pdf", adds: "§3.3 on perplexity and §3.6 on smoothing, the two ideas at the heart of the mini-project." },
    { label: "Andrej Karpathy, nanoGPT", url: "https://github.com/karpathy/nanoGPT", adds: "The next step up: a few hundred lines of PyTorch that train a real GPT-2-style model." },
  ],
};
