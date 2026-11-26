import type { DeepLesson } from "../../../core/types";
import { localListing, part } from "./files";

export const denseEmbeddings: DeepLesson = {
  why: [
    "Remember why Bag-of-Words failed? Every word got its own private column, so `film` and `movie` had nothing in common. What we really want is a representation where **meaning is geometry**: texts that mean similar things sit close together, whatever words they use.",
    "How could a computer possibly learn what words mean? The idea that unlocked it is old, from linguistics: *you shall know a word by the company it keeps* (J. R. Firth, 1957). Think about it: `film` and `movie` show up next to the same words (`watched`, `director`, `great`, `cinema`). So a system that learns from which words appear together should end up giving them similar numbers. In 2013, **word2vec** showed that a small neural network trained on billions of words does exactly that, and its vectors even support arithmetic like king − man + woman ≈ queen.",
    "Modern models go a step further and embed whole sentences. A sentence-embedding model like **all-MiniLM-L6-v2**, the one running in this page, reads a sentence and outputs 384 numbers. Every sentence, short or long, becomes a point in the same 384-dimensional space, and similar meanings land near each other. That's the foundation of semantic search, clustering, classification and retrieval in the rest of this course. In this step you'll look at real MiniLM vectors, search with them, and find out what they still get wrong.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's look at a real one. MiniLM turns `The film was great` into a list of 384 numbers. Here are the first six. On their own they mean nothing; and only their positions relative to other sentences matter. The vector's length is exactly 1 (the model **normalises** it), so cosine similarity is just the dot product.",
    },
    {
      kind: "table",
      caption: "The first 6 of 384 numbers for “The film was great”",
      columns: ["dimension", "value"],
      rows: [
        [1, -0.1038],
        [2, 0.0786],
        [3, -0.0435],
        [4, -0.0139],
        [5, 0.0204],
        [6, 0.0184],
      ],
      source: "worked/dense-embeddings.py",
    },
    {
      kind: "text",
      text: "Now the real test. Compare the same pairs with both methods: Bag-of-Words cosine (counts) and the cosine of MiniLM's real vectors.",
    },
    {
      kind: "table",
      caption: "Bag-of-Words vs dense embedding similarity",
      columns: ["sentence A", "sentence B", "Bag-of-Words", "MiniLM"],
      rows: [
        ["The film was great", "The movie was excellent", 0.5, 0.891],
        ["How do I reset my password?", "I forgot my login details", 0.365, 0.587],
        ["My card was charged twice", "I see a payment I don't recognise", 0, 0.395],
        ["The film was great", "Interest rates rose today", 0, 0.023],
        ["Dog bites man", "Man bites dog", 1, 0.906],
      ],
      source: "worked/dense-embeddings.py",
    },
    {
      kind: "text",
      text: "What do you notice? Rows 1–3 are the win: same meaning, few or no shared words, and MiniLM still scores them as related. The card-charge pair shares **no** words at all (Bag-of-Words 0) and MiniLM sees the connection (0.395). Row 4 is a good **unrelated** score (0.023). Row 5 is the warning: opposite meanings, and MiniLM still says 0.906. Dense vectors fixed *meaning*; they did not fully fix *order*.",
    },
  ],
  concept: [
    {
      heading: "Dense vs sparse",
      paragraphs: [
        "A Bag-of-Words vector is **sparse**: as long as the vocabulary (tens of thousands of entries), almost all zeros, and each position tied to one word. A dense embedding is the opposite. It's short (384 numbers for MiniLM, 768 to 4,096 for bigger models), and almost every number is non-zero.",
        "Here's the strange part: no single position means anything you could name. There's no \"movie dimension\". Meaning is spread across all of them, and only the distances and directions between vectors carry information.",
        "That spreading is exactly what lets similar meanings share structure. `film` and `movie` don't need to share a column; they just need vectors pointing in similar directions. And a model learns to put them there, because it helps with its training task.",
      ],
      formula: {
        expr: "embed(text) → v ∈ ℝ³⁸⁴,   |v| = 1,   similarity = v₁ · v₂",
        symbols: [
          { sym: "embed", meaning: "the embedding model (here all-MiniLM-L6-v2)" },
          { sym: "ℝ³⁸⁴", meaning: "a list of 384 real numbers" },
          { sym: "|v| = 1", meaning: "the vector is normalised to length 1" },
          { sym: "v₁ · v₂", meaning: "for unit-length vectors the dot product equals the cosine" },
        ],
        example: "film vs movie: v₁ · v₂ = 0.891; film vs interest rates: 0.023.",
      },
      lab: {
        view: "dense-vs-sparse",
        label: "Sparse vs dense",
        task: "Pick a sentence and compare its two vectors. How many numbers are non-zero in each? Hover over a few dense dimensions: can you find one that means anything on its own?",
      },
    },
    {
      heading: "Where dense vectors come from",
      paragraphs: [
        "**Word embeddings** came first (word2vec, 2013; GloVe, 2014), with one vector per word. word2vec slides a small window over billions of words and trains a shallow network to predict a word from its neighbours (or the other way round). Words that keep similar company get pushed to similar vectors. The result is a lookup table, much like the embedding table inside an LLM, which is learned for the very same reason.",
        "**Sentence embeddings** need more, because a sentence's meaning depends on all its words together. MiniLM is a small transformer: 6 layers, 384 wide, about 22.7 million weights. It reads the sentence, produces a vector for each token, then **mean-pools**: averages those token vectors into one.",
        "And how does it learn which sentences belong together? It was trained on over a billion pairs of related sentences (questions and their answers, titles and their posts), pulling related pairs close and pushing unrelated ones apart. That training is what makes its cosine scores meaningful for search.",
      ],
      mistake:
        "Comparing vectors from two different embedding models. Each model invents its own space; dimension 17 of MiniLM and dimension 17 of another model are unrelated, so similarities across models are meaningless. Always embed everything you compare with the same model.",
      lab: {
        view: "contrastive",
        label: "Training the space",
        task: "Press **Train 5 steps** a few times and watch related pairs drift together while unrelated sentences drift apart. That's the idea behind MiniLM's training, in 2 dimensions instead of 384.",
      },
    },
    {
      heading: "Using embeddings: nearest neighbours",
      paragraphs: [
        "Once every text is a point, most tasks turn into geometry. **Semantic search**: embed the query, find the stored texts with the highest cosine. **Clustering**: group points that sit close together (Module 07). **Classification**: put a text in the class whose examples it's nearest to (Module 06). **Duplicate detection**: flag pairs above a similarity threshold. And notice the economics: the expensive model runs once per text; every comparison afterwards is just a dot product, millions per second.",
        "Storage is cheap enough to plan on the back of an envelope. One million documents × 384 numbers × 4 bytes = 1.54 GB. Comparing a query against all of them is one matrix multiplication. Past tens of millions of vectors, systems switch to **approximate nearest-neighbour** indexes (the engines inside vector databases), which skip most comparisons and still find almost all of the true nearest neighbours.",
        "One warning: scores are relative, not absolute. 0.395 for the card-charge pair doesn't mean \"39.5% similar\". What matters is that it's far above the unrelated 0.023. Every model has its own typical range, so set thresholds by looking at real examples from your own data, not by picking a round number.",
      ],
      formula: {
        expr: "nearest(q) = argmaxₓ  embed(q) · embed(x)",
        symbols: [
          { sym: "q", meaning: "the query text" },
          { sym: "x", meaning: "each stored text" },
          { sym: "argmax", meaning: "the x that gives the largest value" },
        ],
        example: "q = `How do I reset my password?`: the top results are `I forgot my login details` (0.587) and `I can't sign in to my account`, neither of which contains `password`.",
      },
      lab: {
        view: "neighbours",
        label: "Nearest neighbours",
        task: "Search from `How do I reset my password?`. Do the top results share its words? Now pick `My card was charged twice`: what does MiniLM think it's closest to?",
      },
    },
    {
      heading: "What mean pooling loses",
      paragraphs: [
        "Here's a puzzle. `Dog bites man` and `Man bites dog` score 0.906. Why so high, when they mean such different things?",
        "MiniLM's token vectors *do* depend on order (it's a transformer, so each token's vector comes from its context). But averaging them into one sentence vector washes most of that difference out, and its training data rarely rewarded telling such pairs apart. So single sentence vectors are great at *topic* and *intent*, and weak at *who did what to whom*, negation, and exact numbers.",
        "That's a fundamental trade-off, not a bug in MiniLM. Squeeze a whole text into one point and you *must* throw information away. When order and detail matter, you need the full sequence of token vectors and a model that reads them together, which is what a generative LLM does. The next step shows how token vectors change with context.",
      ],
      mistake:
        "Trusting a high embedding score to mean \"says the same thing\". `The payment was approved` and `The payment was not approved` usually score very high. Embeddings find texts *about* the same thing; checking what they *say* needs a model that reads both, or a human.",
      lab: {
        view: "pooling-loses",
        label: "Averaging",
        task: "Swap the word order and watch the average. Did it change at all? Then try weighting the first word more heavily. Why might that help a little?",
      },
    },
    {
      heading: "Embedding models vs LLMs",
      paragraphs: [
        "An embedding model and a generative LLM are built from the same parts: tokenizer, embedding table, transformer blocks. So what's different? What they're trained to output. One vector per text, versus a probability for every next token.",
        "And size makes a huge practical difference. MiniLM runs in this page in milliseconds. That's why real systems use embedding models to search millions of documents, then pass only the best few to an LLM. (The \"Run it locally\" listing runs the same MiniLM at full precision and gets 0.92 for film vs movie, where this page's 8-bit copy gives 0.891: compressing the weights moves scores in the second decimal, not the ranking.) Step 10 of this module compares the two kinds side by side.",
      ],
      lab: {
        view: "embed-vs-llm",
        label: "Small vs large",
        task: "Compare MiniLM with gemma4. Then set 10 million documents: how much more compute would reading them all with gemma4 take?",
      },
    },
  ],
  guided:
    "Predict first: will `The film was great` vs `The movie was excellent` score higher with MiniLM than its 0.5 with Bag-of-Words? Check in the **Overview**, then try `Dog bites man` vs `Man bites dog` and explain what you see.",
  build: {
    id: "01-dense-embeddings",
    title: "Semantic search with real MiniLM vectors",
    packages: ["numpy"],
    data: "minilm",
    parts: [
      part("dense-embeddings", "p1", "Write `cosine(a, b)` with NumPy and check it on two real MiniLM vectors (it should give **0.891** for film vs movie).", [
        "`np.dot(a, b)` is the dot product; `np.linalg.norm(a)` is the length.",
        "Wrap in `float(...)` so you return a plain number.",
      ]),
      part("dense-embeddings", "p2", "Write `nearest(query, k)`: a semantic search over 14 real sentences. The password question should find the login sentences, which don't contain the word `password`.", [
        "Score every other sentence: `[(cosine(q, vec), s) for s, vec in vectors.items() if s != query]`.",
        "`sorted(scored, reverse=True)[:k]`.",
      ]),
      part("dense-embeddings", "p3", "Write `most_similar_pair()`: compare every pair and find the closest two sentences. Look at which pair wins.", [
        "Two loops with `j` starting at `i + 1` visit each pair once.",
        "Keep `(score, a, b)` whenever the score beats the best so far.",
      ]),
    ],
  },
  local: [localListing("dense", "sentence-transformers: the same model at full precision", ["sentence-transformers"])],
  checks: [
    {
      id: "de-synonyms",
      prompt: "`My card was charged twice` and `I see a payment I don't recognise` share no words. Why can MiniLM still score them as related?",
      options: [
        "It secretly counts letters",
        "It was trained so that related texts get nearby vectors, so meaning (not shared words) decides the distance",
        "It translates both into the same words first",
        "Because both are short",
      ],
      correctIndex: 1,
      explanation: "Dense vectors place texts by learned meaning. Words that are used in similar situations end up pointing in similar directions, so related texts land close together even with no words in common.",
    },
    {
      id: "de-negation",
      prompt: "A search system embeds `refund was approved` and finds `refund was not approved` with cosine 0.95. What should you conclude?",
      options: [
        "The two say the same thing",
        "They are about the same topic, but a single sentence vector is weak at negation and order, so check what they actually say",
        "The model is broken",
        "Increase the number of dimensions",
      ],
      correctIndex: 1,
      explanation: "Sentence embeddings capture topic and intent well and detail poorly. Use them to find candidates; use a reader (an LLM, a reranker or a person) to judge what the candidates actually say.",
    },
    {
      id: "de-models",
      prompt: "You embedded your documents with MiniLM last year and now embed new queries with a different, newer model. What happens to search?",
      options: [
        "It gets better, because the new model is better",
        "It breaks: vectors from two models live in different spaces, so their similarities are meaningless. Re-embed the documents with the new model",
        "Nothing changes, because both have the same dimension",
        "Only long queries are affected",
      ],
      correctIndex: 1,
      explanation: "Each model learns its own coordinate system. Compare only vectors made by the same model, and plan for re-embedding when you switch.",
    },
  ],
  oneSentence:
    "A dense embedding model turns any text into a short vector placed so that similar meanings sit close together, which makes search and grouping by meaning a matter of cosine similarity, but a single vector per text blurs word order and negation.",
  deeper: [
    { label: "Mikolov et al. 2013, word2vec", url: "https://arxiv.org/abs/1301.3781", adds: "The paper that showed simple networks learn word vectors with meaningful directions." },
    { label: "Reimers & Gurevych 2019, Sentence-BERT", url: "https://arxiv.org/abs/1908.10084", adds: "How sentence-embedding models are trained with pairs and mean pooling, the recipe behind MiniLM's vectors." },
    { label: "all-MiniLM-L6-v2 model card", url: "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2", adds: "Its size, its 384-dimensional output, its training on over 1 billion sentence pairs, and the 256-word-piece limit." },
  ],
};
