import type { DeepLesson } from "../../../core/types";
import { localListing, part } from "./files";

export const context: DeepLesson = {
  why: [
    "Read these two sentences: `I deposited cash at the bank` and `We had a picnic on the river bank`. Same word, `bank`, two completely different meanings. You sorted that out instantly, from the surrounding words. How?",
    "A system that gives `bank` one fixed vector can't. Whatever single point it picks has to sit somewhere between money and rivers, and be a little wrong in both sentences. That was the limit of word2vec-style embeddings: one vector per word, wherever it appears. They're called **static** embeddings. And language is full of words like this: `bat`, `spring`, `charge`, `interest`, `run` (which has hundreds of senses). Even words with one meaning shift: `cold` in `cold weather` versus `cold reply`.",
    "The fix is to compute a word's vector **from its context**, every single time it appears. A **contextual** embedding of `bank` in the river sentence gets pulled towards water; in the deposit sentence, towards money. That's what the attention layers from the anatomy step are for: each token's vector is rebuilt from the tokens around it, block after block. In this step you'll see it in real MiniLM vectors, build context by hand, and find out where it still falls short.",
  ],
  worked: [
    {
      kind: "text",
      text: "**Real contextual vectors.** Let's check this on a real model. MiniLM produces a separate 384-number vector for every token in a sentence. Here are its vectors for the token `bank` in four sentences, compared by cosine. A static embedding would make every entry exactly 1.",
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
      text: "Look at the two river senses: they're the closest pair of all (0.902). Context pulled them together. Same-meaning pairs average (0.806 + 0.902) / 2 = 0.854; different-meaning pairs average 0.780. But now look honestly at row 1. Something's off: `bank` in `The bank approved the loan` is slightly closer to `The river bank flooded` (0.826) than to the other money sentence (0.806). Both start `The … bank …` and are short, and those surface patterns leak into the vectors too. Context moves vectors a lot; it does not sort them perfectly by meaning.",
    },
    {
      kind: "text",
      text: "**Building context yourself.** How could mixing in neighbours possibly fix this? Let's try it with tiny numbers. Give each word a static 2-number vector: (money-ness, water-ness). `bank` = (0.5, 0.5), exactly between. Now make `bank`'s vector the average of itself and its neighbours:",
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
      text: "One step of mixing with neighbours, and look: the same word now has two different vectors, each close to the right sense! Attention is this idea made smart: instead of equal weights for every neighbour, it learns *which* neighbours to listen to, and it repeats the mixing in every block.",
    },
  ],
  concept: [
    {
      heading: "Static vs contextual embeddings",
      paragraphs: [
        "A **static** embedding is a lookup table: one vector per vocabulary token, identical in every sentence. The embedding table at the bottom of an LLM is exactly that. Which means the very first vectors inside the model *can't* tell the two `bank`s apart.",
        "A **contextual** embedding is the vector a token has *after* passing through some transformer blocks. By then it's been mixed with information from the rest of the text, so it represents this token, in this sentence. Ask an LLM for the vector of `bank` at block 1 and at block 12, and you'll get different answers. The later ones are shaped more and more by context.",
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
      lab: {
        view: "bank-matrix",
        label: "Four banks",
        task: "Look at the real scores for `bank` in four sentences, then switch to a static table. What information disappears?",
      },
    },
    {
      heading: "Context comes from attention",
      paragraphs: [
        "In the toy, every neighbour got an equal vote. Real attention is smarter: it *computes* the votes. Each token scores every token it may see (query · key), softmax turns the scores into weights, and the token mixes their values. In `I deposited cash at the bank`, the vector for `bank` can put lots of weight on `cash` and `deposited`, and almost none on `I` and `at`. The model learns those preferences during training, because they help it predict text.",
        "And it happens over and over. Block 1 might sort out `bank`. Block 5 might link `it` back to the right noun. Later blocks combine all that into what the sentence as a whole is saying. Each block's output is the next block's input, so information travels and combines across the whole context. By the last block, every vector is soaked in context.",
      ],
      mistake:
        "Thinking contextual vectors cleanly separate meanings. The real MiniLM numbers show `bank` in `The bank approved the loan` sitting closer to a river sentence than to the other money sentence. Vectors carry sentence shape, position and length as well as sense. They are much better than static vectors, not perfect.",
      lab: {
        view: "context-mix",
        label: "Mixing",
        task: "Pick `cash` and `loan` as neighbours, then `river` and `flooded`. Where does `bank` end up each time? Now pick `the` and `river` and turn up the attention on `the`. What happens to the meaning?",
      },
    },
    {
      heading: "How far context reaches",
      paragraphs: [
        "A token can only use context inside the model's **context window**, and in a generative model, only from the left (that's the causal mask). Within the window, though, distance hardly matters. Attention compares every pair directly, so a word 3,000 tokens back is one step away, just like the previous word. That was the big advantage over older recurrent networks, which passed information along one word at a time and tended to forget.",
        "Encoder models (next step) see context on **both** sides. That's why they make such good contextual embeddings: `bank` in `the bank of the river` can use `river` even though it comes later. A decoder writing left to right can't. At the moment it reads `bank`, it hasn't seen `river` yet, and has to wait for later tokens to settle the meaning.",
      ],
      lab: {
        view: "context-reach",
        label: "Reach",
        task: "Slide the document length: which models can read a 3,000-token document in one go? Then switch between left-only and two-sided context and watch what `bank` can see.",
      },
    },
    {
      heading: "Sentence vectors vs token vectors",
      paragraphs: [
        "MiniLM gives you both kinds. The token vectors (one per token, contextual) are what this step used. The sentence vector from the previous step is simply their **average** (mean pooling).",
        "Averaging is what makes sentence vectors so convenient, one point per text. It's also what blurs the order information the token vectors carried. Remember `Dog bites man`? That's the trade-off you saw there.",
        "Generative LLMs keep all the token vectors right up to the output head, and predict from the last one, which has had the chance to attend to everything before it. Nothing gets averaged away, which is a big part of why they handle order, negation and detail far better than a single sentence vector can.",
      ],
      lab: {
        view: "token-sentence",
        label: "Tokens → sentence",
        task: "Click `bank` and see which other token's vector it's closest to. Then check the bottom line: is the average of the token vectors really MiniLM's sentence vector?",
      },
    },
    {
      heading: "Using token vectors in practice",
      paragraphs: [
        "With Hugging Face `transformers`, you get every block's token vectors by asking for the hidden states (`output_hidden_states=True`): one T × d grid per block, plus the static embeddings at the bottom. Which block should you use? Early blocks stay close to the word itself, middle blocks tend to carry the most transferable meaning, and the last blocks are tuned to whatever the model was trained to output. For sentence-embedding models like MiniLM, the last block is what the training targeted, so that's the usual choice.",
        "Here's a simple, real use: **word-sense disambiguation by example**. Store the vector of `bank` from a few sentences you've labelled (money or river), then label a new occurrence by its nearest stored example. It works well when the senses are clearly different and you compare like with like. The `The bank approved the loan` row above is a reminder: check it on real data instead of assuming.",
      ],
      lab: {
        view: "sense-by-example",
        label: "Sense by example",
        task: "Each `bank` is labelled by its nearest neighbour among the other three. How many does it get right? Look at the one it gets wrong: why might that be?",
      },
    },
    {
      heading: "Why this matters for everything else",
      paragraphs: [
        "Contextual vectors are why modern models can handle ambiguity, pronouns, sarcasm and long-range references at all.",
        "They also explain how this course is split up. Module 02 looks at the static table (where `bank` has one vector). Module 03 opens the blocks that make it contextual. Module 09 relies on contextual sentence vectors to search documents by meaning.",
      ],
      lab: {
        view: "map",
        label: "Course map",
        task: "Find Modules 02, 03 and 09 on the map. Which ones are about static vectors, which about making them contextual, and which about using them?",
      },
    },
  ],
  guided:
    "Predict first: will MiniLM's vectors for `bank` in the two river sentences be closer to each other than to a money sentence? Check in **Four banks**, then switch to the static table and explain what you lose.",
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
  local: [localListing("context", "transformers: static vs contextual “bank”", ["torch", "transformers"])],
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
