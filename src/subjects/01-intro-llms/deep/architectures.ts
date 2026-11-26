import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const architectures: DeepLesson = {
  why: [
    "Transformers come in three shapes, and the shape decides what a model is good for. Use the wrong one and you fight it: a model built to *understand* text makes a poor writer, and a model built to *write* is a wasteful way to search a million documents.",
    "The difference is surprisingly small. All three use the same blocks you met in the anatomy step. What changes is **who can see whom** inside attention, and **what the model is trained to predict**. An **encoder** (BERT, 2018) lets every token see every other token, and is trained to fill in blanks; it produces excellent vectors for classifying and searching. A **decoder** (GPT, Llama) lets each token see only earlier tokens, and is trained to predict the next one; it can write. An **encoder-decoder** (the original 2017 Transformer, T5) joins the two: one reads the input, the other writes the output.",
    "Almost every chatbot today is decoder-only, and almost every semantic search system uses an encoder. Knowing why takes one attention mask and one training objective, which you will build in this step.",
  ],
  worked: [
    {
      kind: "text",
      text: "Take the four tokens `the cat sat down`. In attention, row i lists which positions token i may look at (1 = may look). An **encoder** allows everything:",
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
      text: "A **decoder** allows only the past and itself. This is the **causal mask** from the anatomy step, a lower triangle of ones:",
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
      text: "The masks decide the training task. A decoder learns from **every position at once**: one sentence of 4 tokens gives 3 examples of \"given this, predict the next token\":",
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
      text: "An encoder can't be trained that way: with the full sentence visible, \"predict the next token\" is just copying. So BERT hides tokens instead. `the cat [MASK] down` → predict `sat`, using context from **both** sides (`cat` before, `down` after). This is **masked language modelling**. BERT hides 15% of the tokens in each training sequence.",
    },
  ],
  concept: [
    {
      heading: "The three families",
      paragraphs: [
        "**Encoder-only** models (BERT, RoBERTa, and sentence-embedding models like MiniLM) read the whole input at once, with every token attending to every other. Their output is a contextual vector per token, which you pool into a sentence vector or feed to a small classifier. They are fast, compact and excellent at *understanding* tasks: classification, search, clustering, named-entity tagging. They cannot naturally write free text.",
        "**Decoder-only** models (GPT-2, GPT-3, Llama, Gemma, and most chat models) read left to right with a causal mask. Their output is a probability for the next token at every position. They generate text, and because almost any task can be phrased as text in, text out, they are the general-purpose workhorse.",
        "**Encoder-decoder** models (the original Transformer, T5, BART) pair the two. The encoder reads the full input bidirectionally; the decoder writes the output causally while also attending to the encoder's vectors (**cross-attention**, the next step). They shine when the output is a transformation of a clearly separate input: translation, summarisation.",
      ],
    },
    {
      heading: "The mask is the only structural difference",
      paragraphs: [
        "Inside attention, the mask is applied to the score grid before softmax: allowed positions keep their score, forbidden ones become −∞ and therefore get weight exactly 0. Same blocks, same matrices; one triangle of −∞ turns an encoder into a decoder.",
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
    },
    {
      heading: "What each family is trained to do",
      paragraphs: [
        "**Next-token prediction** (decoders): every position predicts the token after it. A sequence of T tokens yields T − 1 training examples in one forward pass, and the causal mask guarantees none of them can peek at its answer. The objective matches the use: generating is just next-token prediction run in a loop.",
        "**Masked language modelling** (encoders): hide a random 15% of tokens and predict them from both sides. Of the chosen positions, BERT replaces 80% with `[MASK]`, 10% with a random token and leaves 10% unchanged, so the model can't rely on `[MASK]` appearing at use time. Only the hidden positions produce training signal, so each sequence teaches less than it would a decoder, but every prediction uses full two-sided context.",
        "**Span corruption** (T5, encoder-decoder): hide whole spans in the input and have the decoder write them out. It sits between the two: the encoder reads with full context, the decoder writes like a decoder.",
      ],
      mistake:
        "Assuming BERT-style encoders are just older, worse GPTs. They solve a different problem. For turning a million documents into vectors for search, a 22-million-weight encoder is faster, cheaper and often better than an 8-billion-weight decoder.",
    },
    {
      heading: "Why decoders took over",
      paragraphs: [
        "Three properties made decoder-only models the default for LLMs. **Generality**: any task phrased as text in, text out can be done by continuing text, from translation to code. **Efficient training**: every token is a training example, and training data is just raw text, which exists in near-limitless quantities. **Scaling**: research such as GPT-3 showed that larger decoders trained on more text get steadily better and pick up abilities (few-shot learning from examples in the prompt) that smaller ones lack.",
        "Encoders did not disappear. They moved into roles where a vector is the product: search, retrieval, classification, deduplication. Real systems routinely use both: an encoder to find the right documents, a decoder to write the answer from them. That is the RAG pattern of Module 09.",
      ],
    },
    {
      heading: "Real sizes, side by side",
      paragraphs: [
        "The families also differ in typical size, because they are used differently. BERT-base is an encoder of 12 blocks, width 768, about 110 million parameters. MiniLM, the encoder in this page, is 6 blocks, width 384, about 22.7 million: small enough to embed text in a browser tab. T5-small, an encoder-decoder, is about 60 million. On the decoder side GPT-2 small is 124 million, and today's chat models start around a billion and run to hundreds of billions.",
        "Encoders stay small because their job (one good vector per text) saturates early and is run over huge collections, so speed matters. Decoders grew because writing well about anything keeps improving with scale. That difference in economics, not just the mask, is why you will meet small encoders and large decoders together in nearly every real system.",
      ],
    },
    {
      heading: "Reading a model card",
      paragraphs: [
        "When you meet a new model, three questions place it. Is it encoder, decoder or encoder-decoder (the card or config usually says: `BertModel`, `LlamaForCausalLM`, `T5ForConditionalGeneration`)? What was it trained to predict (masked tokens, next tokens, spans, then possibly instructions)? What does it output (vectors or text)? Those three answers tell you, before you run anything, whether it suits your task.",
      ],
    },
  ],
  guided:
    "Predict first: in a decoder, which token can see the most other tokens, the first or the last? Switch between the architectures below and watch the grid change. Then find the one setting where a token can see nothing but itself.",
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
