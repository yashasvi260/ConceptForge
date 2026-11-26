import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const architectures: DeepLesson = {
  why: [
    "Transformers come in three shapes, and the shape decides what a model is good for. Pick the wrong one and you'll be fighting it. A model built to *understand* text makes a poor writer. A model built to *write* is a wasteful way to search a million documents.",
    "Here's the surprise: the difference is tiny. All three use the same blocks you met in the anatomy step. What changes is **who can see whom** inside attention, and **what the model is trained to predict**. An **encoder** (BERT, 2018) lets every token see every other token and is trained to fill in blanks; it produces excellent vectors for classifying and searching. A **decoder** (GPT, Llama) lets each token see only earlier tokens and is trained to predict the next one; it can write. An **encoder-decoder** (the original 2017 Transformer, T5) joins the two: one half reads the input, the other writes the output.",
    "Almost every chatbot today is a decoder, and almost every semantic search system uses an encoder. Why? It comes down to one attention mask and one training objective, and you'll build both in this step.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's make this concrete. Take the four tokens `the cat sat down`. In attention, row i lists which positions token i may look at (1 = may look). An **encoder** allows everything:",
    },
    {
      kind: "table",
      caption: "Encoder (bidirectional): 1 = may look",
      columns: ["token", "the", "cat", "sat", "down"],
      rows: [
        ["the", 1, 1, 1, 1],
        ["cat", 1, 1, 1, 1],
        ["sat", 1, 1, 1, 1],
        ["down", 1, 1, 1, 1],
      ],
      source: "worked/architectures.py",
    },
    {
      kind: "text",
      text: "Now a **decoder**. It allows only the past and itself. This is the **causal mask** from the anatomy step, a lower triangle of ones:",
    },
    {
      kind: "table",
      caption: "Decoder (causal): 1 = may look",
      columns: ["token", "the", "cat", "sat", "down"],
      rows: [
        ["the", 1, 0, 0, 0],
        ["cat", 1, 1, 0, 0],
        ["sat", 1, 1, 1, 0],
        ["down", 1, 1, 1, 1],
      ],
      source: "worked/architectures.py",
    },
    {
      kind: "text",
      text: "Here's why the mask matters so much: it decides the training task. A decoder learns from **every position at once**: one sentence of 4 tokens gives 3 examples of \"given this, predict the next token\":",
    },
    {
      kind: "table",
      caption: "A decoder's training examples from one sentence",
      columns: ["context the model sees", "token it must predict"],
      rows: [
        ["the", "cat"],
        ["the cat", "sat"],
        ["the cat sat", "down"],
      ],
      source: "worked/architectures.py",
    },
    {
      kind: "text",
      text: "Could you train an encoder the same way? No! With the full sentence visible, \"predict the next token\" is just copying. So BERT hides tokens instead. `the cat [MASK] down` → predict `sat`, using context from **both** sides (`cat` before, `down` after). This is **masked language modelling**. BERT hides 15% of the tokens in each training sequence.",
    },
  ],
  concept: [
    {
      heading: "The three families",
      paragraphs: [
        "**Encoder-only** models (BERT, RoBERTa, and sentence-embedding models like MiniLM) read the whole input at once, every token attending to every other. What comes out is a contextual vector per token, which you pool into a sentence vector or feed to a small classifier. They're fast, compact and excellent at *understanding* tasks: classification, search, clustering, tagging names in text. What they can't naturally do is write free text.",
        "**Decoder-only** models (GPT-2, GPT-3, Llama, Gemma, and most chat models) read left to right with a causal mask. What comes out is a probability for the next token at every position. They generate text, and since almost any task can be phrased as text in, text out, they've become the general-purpose workhorse.",
        "**Encoder-decoder** models (the original Transformer, T5, BART) pair the two. The encoder reads the full input in both directions; the decoder writes the output left to right, while also looking at the encoder's vectors (that's **cross-attention**, next step). They shine when the output is a transformation of a clearly separate input: translation, summarisation.",
      ],
      lab: {
        view: "families",
        label: "Which family?",
        task: "Click through the tasks. For each one, guess the family before you read the answer. Which tasks could two families handle?",
      },
    },
    {
      heading: "The mask is the only structural difference",
      paragraphs: [
        "So what actually turns an encoder into a decoder? Just the mask. Inside attention, it's applied to the score grid before softmax: allowed positions keep their score, forbidden ones become −∞, and so get weight exactly 0.",
        "Same blocks. Same matrices. One triangle of −∞, and an encoder becomes a decoder.",
      ],
      formula: {
        expr: "weights = softmax(S + M),   Mᵢⱼ = 0 if allowed else −∞\ncausal:        allowed ⇔ j ≤ i\nbidirectional: allowed for every i, j",
        symbols: [
          { sym: "S", meaning: "the T × T grid of attention scores (query · key / √d)" },
          { sym: "M", meaning: "the mask: 0 where looking is allowed, −∞ where it isn't" },
          { sym: "i, j", meaning: "the looking token (row) and the looked-at token (column)" },
        ],
        example: "Row 1 of scores [0.0, 0.6, 3.0] with a causal mask → softmax over [0.0, 0.6] only → [0.354, 0.646, 0]. The big 3.0 at a future position is ignored.",
      },
      lab: {
        view: "arch",
        label: "Who sees whom",
        task: "Switch between the families and click different rows. In a decoder, which token can see the most? Is there a setting where a token sees nothing but itself?",
      },
    },
    {
      heading: "What each family is trained to do",
      paragraphs: [
        "**Next-token prediction** (decoders): every position predicts the token after it. So a sequence of T tokens gives T − 1 training examples in a single forward pass, and the causal mask guarantees none of them can peek at the answer. And notice how neatly the training matches the use: generating is just next-token prediction run in a loop.",
        "**Masked language modelling** (encoders): hide a random 15% of the tokens and predict them from both sides. There's a clever twist. Of the chosen positions, BERT replaces 80% with `[MASK]`, 10% with a random token, and leaves 10% unchanged, so the model can't learn to rely on `[MASK]` showing up (it never does in real use). Only the hidden positions teach anything, so each sequence teaches less than it would a decoder. But every prediction gets full two-sided context.",
        "**Span corruption** (T5, encoder-decoder): hide whole stretches of the input and have the decoder write them out. It's a middle ground: the encoder reads with full context, the decoder writes like a decoder.",
      ],
      mistake:
        "Assuming BERT-style encoders are just older, worse GPTs. They solve a different problem. For turning a million documents into vectors for search, a 22-million-weight encoder is faster, cheaper and often better than an 8-billion-weight decoder.",
      lab: {
        view: "objectives",
        label: "Training examples",
        task: "Type a sentence and switch between the three objectives. How many training examples does each one get from your sentence? Press **Mask again** a few times: which tokens does BERT hide?",
      },
    },
    {
      heading: "Why decoders took over",
      paragraphs: [
        "If encoders are so good, why is nearly every big model today a decoder? Three reasons.",
        "**Generality**: any task phrased as text in, text out can be done by continuing text, from translation to code. **Efficient training**: every token is a training example, and the training data is just raw text, which exists in near-limitless amounts. **Scaling**: research like GPT-3 showed that bigger decoders trained on more text get steadily better, and pick up abilities (like learning a new task from a few examples in the prompt) that smaller ones lack.",
        "But encoders didn't disappear. They moved into jobs where a vector *is* the product: search, retrieval, classification, deduplication. Real systems routinely use both: an encoder to find the right documents, a decoder to write the answer from them. That's the RAG pattern of Module 09.",
      ],
      lab: {
        view: "task-framing",
        label: "Text in, text out",
        task: "Compare how a decoder and an encoder handle each task. Which tasks need nothing but a different prompt for the decoder? Which one does the encoder handle more naturally?",
      },
    },
    {
      heading: "Real sizes, side by side",
      paragraphs: [
        "The families also differ in typical size, because they're used so differently. BERT-base is an encoder of 12 blocks, width 768, about 110 million parameters. MiniLM, the encoder in this page, is 6 blocks, width 384, about 22.7 million: small enough to run in a browser tab. T5-small, an encoder-decoder, is about 60 million. On the decoder side, GPT-2 small is 124 million, and today's chat models start around a billion and run to hundreds of billions.",
        "Why do encoders stay small? Their job, one good vector per text, stops improving much with size fairly early, and it's run over huge collections, so speed matters. Decoders kept growing because writing well about anything keeps improving with scale. That difference in economics, not just the mask, is why you'll meet small encoders and big decoders side by side in nearly every real system.",
      ],
      lab: {
        view: "family-sizes",
        label: "Sizes",
        task: "Show only encoders, then only decoders. How many times bigger is the largest decoder than the largest encoder here? Hover the bars for the exact counts.",
      },
    },
    {
      heading: "Reading a model card",
      paragraphs: [
        "When you meet a new model, three questions place it.",
        "Is it an encoder, a decoder or an encoder-decoder? (The card or config usually says: `BertModel`, `LlamaForCausalLM`, `T5ForConditionalGeneration`.) What was it trained to predict: masked tokens, next tokens, spans, and then possibly instructions? And what does it output: vectors or text? Answer those three, and you know whether it suits your task before you've run a single thing.",
      ],
      lab: {
        view: "model-card",
        label: "Model card",
        task: "Open each real config. From `architectures` alone, can you tell the family? Then find the field that tells you Llama 3 has a separate output head.",
      },
    },
  ],
  guided:
    "Predict first: in a decoder, which token can see the most other tokens, the first or the last? Check in **Who sees whom**. Then open **Training examples** and count how many examples one sentence gives a decoder compared with an encoder.",
  build: {
    id: "01-architectures",
    title: "Build both masks and both training objectives",
    packages: ["numpy"],
    parts: [
      part("architectures", "p1", "Write `causal_mask(T)` and `bidirectional_mask(T)`. The causal one must match the worked example's lower triangle.", [
        "`np.tril(np.ones((T, T)))` keeps the lower triangle (including the diagonal).",
        "`.astype(bool)` turns 1/0 into True/False; `np.ones((T, T), dtype=bool)` for the encoder.",
      ]),
      part("architectures", "p2", "Write `masked_softmax(scores, mask)`: softmax that gives exactly 0 weight to forbidden positions.", [
        "`np.where(mask, scores, -np.inf)` blanks out forbidden scores.",
        "`np.exp(-np.inf)` is exactly 0, so the masked entries vanish after softmax.",
      ]),
      part("architectures", "p3", "Write the two training objectives: `decoder_examples(tokens)` (every context → next token) and `masked_lm_example(tokens, positions)` (BERT's fill in the blanks).", [
        "`[(tokens[:i], tokens[i]) for i in range(1, len(tokens))]`.",
        "Build a new list with `\"[MASK]\"` at the chosen positions, and a dict of what was hidden.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "ar-search",
      prompt: "You need to turn 2 million support articles into vectors for semantic search. Which family fits best, and why?",
      options: [
        "A large decoder, because it is the most capable",
        "An encoder (sentence-embedding model): it reads each text bidirectionally and outputs a vector, quickly and cheaply",
        "An encoder-decoder, because it has two parts",
        "None, because search needs Bag-of-Words",
      ],
      correctIndex: 1,
      explanation: "The product is a vector per text, which is exactly what encoders are trained to give. A small encoder embeds millions of texts far faster than a large decoder.",
    },
    {
      id: "ar-signal",
      prompt: "From one 100-token sequence, roughly how many tokens does each objective learn to predict?",
      options: [
        "Decoder 99, BERT about 15 (the masked 15%)",
        "Both 100",
        "Decoder 1, BERT 100",
        "Decoder 15, BERT 99",
      ],
      correctIndex: 0,
      explanation: "Next-token prediction trains on every position (T − 1 of them); masked language modelling only on the hidden ~15%. That efficiency is one reason decoders scale so well on raw text.",
    },
    {
      id: "ar-bert-gen",
      prompt: "Why can't you simply train a bidirectional encoder with next-token prediction?",
      options: [
        "It would be too slow",
        "Every position could see the token it must predict, so it would learn to copy instead of predict",
        "Encoders have no output head",
        "The vocabulary would be too large",
      ],
      correctIndex: 1,
      explanation: "With no causal mask, position i can attend to position i + 1, the answer itself. Hiding tokens (masking) is how encoders get a task that can't be solved by copying.",
    },
  ],
  oneSentence:
    "Encoders let every token see the whole text and learn by filling in blanks (good for vectors), decoders let each token see only the past and learn to predict the next token (good for writing), and encoder-decoders read with one and write with the other.",
  deeper: [
    { label: "Devlin et al. 2019, BERT", url: "https://arxiv.org/abs/1810.04805", adds: "§3.1 describes masked language modelling, including the 15% and 80/10/10 rule." },
    { label: "Radford et al. 2018, GPT (Improving Language Understanding by Generative Pre-Training)", url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf", adds: "The decoder-only, next-token recipe that GPT-2, GPT-3 and Llama scaled up." },
    { label: "Raffel et al. 2020, T5", url: "https://arxiv.org/abs/1910.10683", adds: "§3.2 compares encoder-decoder, decoder-only and prefix models on the same tasks." },
  ],
};
