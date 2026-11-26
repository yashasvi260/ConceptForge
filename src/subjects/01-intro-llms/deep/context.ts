import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const context: DeepLesson = {
  why: [
    "`I deposited cash at the bank` and `We had a picnic on the river bank` both contain `bank`, and they mean completely different things. You resolved that instantly, from the surrounding words. A system that gives `bank` one fixed vector cannot: whatever single point it picks must sit somewhere between money and rivers, and be a little wrong in both sentences.",
    "That was the limit of word2vec-style embeddings (one vector per word, no matter where it appears). They are called **static** embeddings. Language is full of words like this: `bat`, `spring`, `charge`, `interest`, `run` (which has hundreds of senses). Even words with one meaning shift with context: `cold` in `cold weather` versus `cold reply`.",
    "The fix is to compute a word's vector **from its context**, every time it appears. A **contextual** embedding of `bank` in the river sentence is pulled towards water; in the deposit sentence, towards money. This is what the attention layers in the anatomy step are for: each token's vector is rebuilt from the tokens around it, block after block. This step shows it with real MiniLM vectors, and has you build contextual vectors yourself from static ones.",
  ],
  worked: [
    {
      kind: "text",
      text: "**Real contextual vectors.** MiniLM produces a separate 384-number vector for every token in a sentence. Here are its vectors for the token `bank` in four sentences, compared by cosine. A static embedding would make every entry exactly 1.",
    },
    {
      kind: "table",
      caption: "Cosine between MiniLM's vectors for “bank” in four sentences",
      columns: ["“bank” in…", "approved the loan", "deposited cash", "river … flooded", "picnic … river"],
      rows: [
        ["approved the loan", 1, 0.806, 0.826, 0.758],
        ["deposited cash", 0.806, 1, 0.757, 0.78],
        ["river … flooded", 0.826, 0.757, 1, 0.902],
        ["picnic … river", 0.758, 0.78, 0.902, 1],
      ],
      source: "worked/context.py",
    },
    {
      kind: "text",
      text: "The two river senses are the closest pair of all (0.902): context has pulled them together. Same-meaning pairs average (0.806 + 0.902) / 2 = 0.854; different-meaning pairs average 0.780. But look honestly at row 1: `bank` in `The bank approved the loan` is slightly closer to `The river bank flooded` (0.826) than to the other money sentence (0.806). Both start `The … bank …` and are short, and those surface patterns leak into the vectors too. Context moves vectors a lot; it does not sort them perfectly by meaning.",
    },
    {
      kind: "text",
      text: "**Building context yourself.** Give each word a static 2-number vector: (money-ness, water-ness). `bank` = (0.5, 0.5), exactly between. Now make `bank`'s vector the average of itself and its neighbours:",
    },
    {
      kind: "math",
      text: "bank + cash + loan     = ((0.5 + 1.0 + 0.9) / 3, (0.5 + 0.0 + 0.1) / 3) = (0.8, 0.2)\nbank + river + flooded = ((0.5 + 0.0 + 0.1) / 3, (0.5 + 1.0 + 0.9) / 3) = (0.2, 0.8)",
    },
    {
      kind: "table",
      caption: "Toy: averaging “bank” with its neighbours",
      columns: ["vector", "money-ness", "water-ness", "cosine with cash", "cosine with river"],
      rows: [
        ["bank (static, any sentence)", 0.5, 0.5, 0.707, 0.707],
        ["bank + cash + loan", 0.8, 0.2, 0.97, 0.243],
        ["bank + river + flooded", 0.2, 0.8, 0.243, 0.97],
      ],
      source: "worked/context.py",
    },
    {
      kind: "text",
      text: "One step of mixing with neighbours, and the same word now has two different vectors, each close to the right sense. Attention is this idea made smart: instead of equal weights for every neighbour, it learns *which* neighbours to listen to, and it repeats the mixing in every block.",
    },
  ],
  concept: [
    {
      heading: "Static vs contextual embeddings",
      paragraphs: [
        "A **static** embedding is a lookup table: one vector per vocabulary token, the same in every sentence. The embedding table at the bottom of an LLM is exactly that, which is why the very first vectors in the model cannot tell the two `bank`s apart.",
        "A **contextual** embedding is the vector a token has *after* passing through some transformer blocks. By then it has been mixed with information from the rest of the text, so it represents this token in this sentence. Ask an LLM for the vector of `bank` at block 1 and at block 12 and you will get different answers; the later ones are increasingly shaped by context.",
      ],
      formula: {
        expr: "static:      v(bank) = E[bank]                       (same everywhere)\ncontextual:  hᵢ = Block_L( … Block_1(E[x₁ … xₙ]) )ᵢ   (depends on every xⱼ it can see)",
        symbols: [
          { sym: "E[bank]", meaning: "the row of the embedding table for `bank`" },
          { sym: "hᵢ", meaning: "the vector at position i after L blocks" },
          { sym: "x₁ … xₙ", meaning: "all the tokens of the sentence" },
        ],
        example: "Toy: E[bank] = (0.5, 0.5) in every sentence; after one averaging step it is (0.8, 0.2) next to cash and loan, and (0.2, 0.8) next to river and flooded.",
      },
    },
    {
      heading: "Context comes from attention",
      paragraphs: [
        "In the toy, every neighbour got an equal vote. Real attention computes the votes: each token scores every token it may see (query · key), turns the scores into weights with softmax, and mixes their values. In `I deposited cash at the bank`, the vector for `bank` can put a large weight on `cash` and `deposited` and almost none on `I` and `at`. The model learns those preferences during training because they help it predict text.",
        "And it happens repeatedly. Block 1 might disambiguate `bank`; block 5 might link `it` back to the right noun; later blocks combine those into what the sentence as a whole is saying. Each block's output is the next block's input, so information can travel and combine across the whole context. By the last block, every vector is soaked in context.",
      ],
      mistake:
        "Thinking contextual vectors cleanly separate meanings. The real MiniLM numbers show `bank` in `The bank approved the loan` sitting closer to a river sentence than to the other money sentence. Vectors carry sentence shape, position and length as well as sense. They are much better than static vectors, not perfect.",
    },
    {
      heading: "How far context reaches",
      paragraphs: [
        "A token can only use context inside the model's **context window**, and in a generative model only from the left (the causal mask). Within that window, distance hardly matters: attention compares every pair directly, so a word 3,000 tokens back is one step away, just like the previous word. That was the big advantage over older recurrent networks, which passed information along one word at a time and tended to forget.",
        "Encoder models (next step) see context on **both** sides. That is why they make good contextual embeddings: `bank` in `the bank of the river` can use `river` even though it comes after. A decoder writing left to right cannot; at the moment it reads `bank` it hasn't seen `river` yet, and has to wait for later tokens to settle the meaning.",
      ],
    },
    {
      heading: "Sentence vectors vs token vectors",
      paragraphs: [
        "MiniLM gives you both. The token vectors (one per token, contextual) are what this step used. The sentence vector from the previous step is their **average** (mean pooling). Averaging is what makes sentence vectors convenient (one point per text) and also what blurs the order information the token vectors carried. That is the trade-off you saw with `Dog bites man`.",
        "Generative LLMs keep all the token vectors right up to the output head, and predict from the last one, which has had the chance to attend to everything before it. Nothing is averaged away, which is a big part of why they handle order, negation and detail far better than a single sentence vector.",
      ],
    },
    {
      heading: "Using token vectors in practice",
      paragraphs: [
        "With Hugging Face `transformers` you get every block's token vectors by asking the model for its hidden states (`output_hidden_states=True`): one T × d grid per block, plus the static embeddings at the bottom. Which block to use is a practical choice. Early blocks stay close to the word itself, middle blocks tend to carry the most transferable meaning, and the last blocks are tuned to whatever the model was trained to output. For sentence-embedding models such as MiniLM, the last block's vectors are what the training targeted, so that is the usual choice.",
        "A simple, real application is **word-sense disambiguation by example**: store the vector of `bank` from a few sentences you have labelled (money or river), then label a new occurrence by its nearest stored example. It works well when the senses are clearly different and you compare like with like. The `The bank approved the loan` row above is a reminder to check it on real data rather than assume.",
      ],
    },
    {
      heading: "Why this matters for everything else",
      paragraphs: [
        "Contextual vectors are why modern models handle ambiguity, pronouns, sarcasm and long-range references at all. They are also why the same word can be split across modules: Module 02 looks at the static table (where `bank` has one vector), Module 03 opens the blocks that make it contextual, and Module 08 relies on contextual sentence vectors to search documents by meaning.",
      ],
    },
  ],
  guided:
    "Predict first: will MiniLM's vectors for `bank` in the two river sentences be closer to each other than to a money sentence? Compare them in the panels below. Then look at the Bag-of-Words panel: what does it say about `bank`, and why?",
  build: {
    id: "01-context",
    title: "Make vectors contextual, then measure real ones",
    packages: ["numpy"],
    data: "minilm",
    parts: [
      part("context", "p1", "Write `contextual(word, neighbours)`: the toy contextual vector, the average of the word's static vector and its neighbours' vectors.", [
        "`vectors` already holds the word's vector and its neighbours'.",
        "Average each position: `sum(v[i] for v in vectors) / len(vectors)` for each i.",
      ]),
      part("context", "p2", "Use MiniLM's **real** token vectors for `bank`: write `same_vs_different()` and show same-meaning pairs are closer on average (0.854 vs 0.780).", [
        "Same: the two money sentences with each other, the two river sentences with each other.",
        "Different: `[cos(bank[m], bank[r]) for m in money for r in river]`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "cx-static",
      prompt: "In a static embedding table, what is the cosine between `bank` in `I deposited cash at the bank` and `bank` in `the river bank flooded`?",
      options: ["Exactly 1, because both look up the same row", "About 0.5", "About 0, because the meanings differ", "It depends on the sentence length"],
      correctIndex: 0,
      explanation: "A static table has one row per token, so both sentences get the identical vector. That is precisely the problem contextual embeddings solve.",
    },
    {
      id: "cx-decoder",
      prompt: "A decoder (GPT-style) reads `the bank of the river`. When it computes the vector for `bank`, can it use `river`?",
      options: [
        "Yes, attention sees everything",
        "No: the causal mask lets `bank` see only `the` and itself. Later tokens' vectors (like `river`'s) can still use `bank`",
        "Only in the last block",
        "Only if the sentence is short",
      ],
      correctIndex: 1,
      explanation: "In a decoder, information flows left to right. `river`'s vector can absorb `bank`, but not the other way round. Encoders, which see both sides, give better contextual vectors for words like `bank`.",
    },
  ],
  oneSentence:
    "A contextual embedding rebuilds each token's vector from the tokens around it (through attention, block after block), so the same word gets different vectors in different sentences, unlike a static lookup table.",
  deeper: [
    { label: "Peters et al. 2018, ELMo: Deep contextualized word representations", url: "https://arxiv.org/abs/1802.05365", adds: "The paper that made contextual word vectors mainstream, with sense-disambiguation experiments." },
    { label: "Ethayarajh 2019, How Contextual are Contextualized Word Representations?", url: "https://arxiv.org/abs/1909.00512", adds: "Measures how much a word's vector changes across contexts, layer by layer, in BERT and GPT-2." },
  ],
};
