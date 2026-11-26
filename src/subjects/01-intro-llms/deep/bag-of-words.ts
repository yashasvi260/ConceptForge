import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const bagOfWords: DeepLesson = {
  why: [
    "Long before LLMs, people needed computers to compare texts. Which support tickets are about the same problem? Which documents match a search? Which reviews are positive? Every one of those needs text turned into numbers you can compare.",
    "The first approach that worked well enough to power real search engines and spam filters was astonishingly blunt: **ignore everything except which words appear, and how often**. That's **Bag-of-Words**. Pour a sentence's words into a bag, shake it so the order is lost, and count. Two texts are similar if their counts are similar. It's fast, it needs no training, and you can see exactly why it gave every score. Ideas from it (like BM25, a smarter word-count score) still sit inside modern search systems; Module 09 uses one.",
    "It's also the clearest way to see what an LLM has to do better. Can Bag-of-Words tell `Dog bites man` from `Man bites dog`? Does it know `film` and `movie` mean the same? Make a guess, then build it from scratch in this step and find out. Every later idea in this module is a fix for one of the two failures you're about to see.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's build one by hand. Take four sentences. The **vocabulary** is every distinct word, in the order first seen: `the film was great movie excellent dog bites man` (9 words). Each sentence becomes 9 counts, one per vocabulary word:",
    },
    {
      kind: "table",
      caption: "Each sentence as counts over the shared vocabulary",
      columns: ["sentence", "the", "film", "was", "great", "movie", "excellent", "dog", "bites", "man"],
      rows: [
        ["The film was great", 1, 1, 1, 1, 0, 0, 0, 0, 0],
        ["The movie was excellent", 1, 0, 1, 0, 1, 1, 0, 0, 0],
        ["Dog bites man", 0, 0, 0, 0, 0, 0, 1, 1, 1],
        ["Man bites dog", 0, 0, 0, 0, 0, 0, 1, 1, 1],
      ],
      source: "worked/bag-of-words.py",
    },
    {
      kind: "text",
      text: "Now, how do we compare two rows? With **cosine similarity**: multiply matching entries and add them up (the dot product), then divide by the two rows' lengths. For the film and movie sentences, only `the` and `was` match:",
    },
    {
      kind: "math",
      text: "dot   = 1·1 (the) + 1·0 + 1·1 (was) + 1·0 + 0·1 + 0·1 = 2\n|film| = √(1² + 1² + 1² + 1²) = 2      |movie| = √(1² + 1² + 1² + 1²) = 2\ncos   = 2 / (2 × 2) = 0.5",
    },
    {
      kind: "table",
      caption: "Cosine similarity of the count vectors",
      columns: ["sentence A", "sentence B", "dot product", "cosine"],
      rows: [
        ["The film was great", "The movie was excellent", 2, 0.5],
        ["Dog bites man", "Man bites dog", 3, 1],
        ["The film was great", "Dog bites man", 0, 0],
      ],
      source: "worked/bag-of-words.py",
    },
    {
      kind: "text",
      text: "Now read that table like a critic. Anything strike you as wrong? The two movie reviews mean the same thing, yet score only 0.5, and all of that comes from `the` and `was`, words that say nothing about the meaning. `Dog bites man` and `Man bites dog` mean opposite things and score a perfect 1. Bag-of-Words measures **shared words**, not shared meaning.",
    },
  ],
  concept: [
    {
      heading: "Vocabulary and count vectors",
      paragraphs: [
        "Building Bag-of-Words takes two passes. First, decide how to split text into words (lowercase it, split on anything that isn't a letter, digit or apostrophe) and collect every distinct word into a **vocabulary** with a fixed order. Second, turn each text into a **count vector**: one entry per vocabulary word, holding how many times that word appears.",
        "Stack the vectors for all your texts and you get a **document-term matrix**: one row per text, one column per word. Now imagine a real collection. The vocabulary runs to tens of thousands of words, and each row is almost all zeros, because a sentence only uses a handful of them. Vectors like this are called **sparse**, and libraries store only the non-zero entries.",
        "Here's a sneaky problem. The vocabulary comes from the texts you built it on. So what happens to a brand-new word in a later text? It has no column, and it simply vanishes. Misspellings and new product names: gone.",
      ],
      formula: {
        expr: "v(text)[i] = number of times vocab[i] occurs in text",
        symbols: [
          { sym: "vocab", meaning: "the ordered list of every distinct word in the collection" },
          { sym: "v(text)", meaning: "the text's count vector, as long as the vocabulary" },
          { sym: "i", meaning: "the position of one word in the vocabulary" },
        ],
        example: "vocab = [the, film, was, great, movie, …]; v(\"The movie was excellent\") = [1, 0, 1, 0, 1, 1, 0, 0, 0].",
      },
      lab: {
        view: "bow",
        label: "Word counts",
        task: "Type a few sentences, one per line, and watch the count matrix and the similarity scores update. Add a sentence that shares no words with the others: what's its score?",
      },
    },
    {
      heading: "Cosine similarity",
      paragraphs: [
        "We want a score that's high when two vectors point the same way, *whatever their length*. Why ignore length? Because a long document repeats words more often than a short one, but it can still be about exactly the same thing.",
        "**Cosine similarity** does exactly that: it's the cosine of the angle between the two vectors. Same direction: 1. Nothing in common: 0. And for vectors that can go negative, as dense embeddings can, opposite directions give −1.",
        "You'll use cosine similarity in almost every module from here on: comparing embeddings, searching documents, clustering texts, checking retrieval. It's worth knowing by heart.",
      ],
      formula: {
        expr: "cos(a, b) = (a · b) / (|a| · |b|)      a · b = Σᵢ aᵢ·bᵢ      |a| = √(Σᵢ aᵢ²)",
        symbols: [
          { sym: "a · b", meaning: "the dot product: multiply matching entries and add them up" },
          { sym: "|a|", meaning: "the length of a: square root of the sum of its squared entries" },
          { sym: "cos", meaning: "1 = same direction, 0 = nothing in common" },
        ],
        example: "film vs movie: a · b = 2, |a| = |b| = 2, so cos = 2 / 4 = 0.5.",
      },
      lab: {
        view: "cosine",
        label: "Cosine",
        task: "Set the angle to 0°, 90° and 180° and read the score each time. Then change the arrows' lengths. Does the score move?",
      },
    },
    {
      heading: "What the bag throws away",
      paragraphs: [
        "So what does shaking the bag cost us? Two big things.",
        "**Order.** `Dog bites man` and `Man bites dog` become the very same vector. So do `not good, very bad` and `not bad, very good`, which mean opposite things! A common patch is to also count pairs of neighbouring words (**bigrams**), but then the vocabulary explodes, and the problem just moves somewhere else.",
        "**Meaning.** Each word is its own column, unrelated to every other. To Bag-of-Words, `film` and `movie` are as different as `film` and `interest`. So two texts saying the same thing in different words get a low score, and two texts sharing filler words get a high one. That's exactly why the worked example's film/movie score came entirely from `the` and `was`.",
        "Real systems soften this. They drop very common **stop words** (`the`, `was`, `is`), and they weight rare words more than common ones (**TF-IDF**, next). Both help a lot for search. But neither can make `film` and `movie` related, because nothing in a count says what a word *means*.",
      ],
      mistake:
        "Reading a high Bag-of-Words score as \"these texts mean the same\". It only means they use the same words. Synonyms score 0, and filler words, negations and word order can make very different sentences look identical.",
      lab: {
        view: "word-order",
        label: "Word order",
        task: "Shuffle the words of a sentence and check its score against the original. Then look at the `not good, very bad` pair. Would you trust this score to tell good reviews from bad?",
      },
    },
    {
      heading: "TF-IDF: weighting the words that matter",
      paragraphs: [
        "Raw counts treat every word as equally informative. That's why `the` and `was` dominated the film/movie score. **TF-IDF** fixes the weighting.",
        "The **term frequency** (TF) is the count you already have. The **inverse document frequency** (IDF) is large for words that appear in few documents, and small for words that appear everywhere. Multiply them, and common words fade while distinctive words stand out.",
        "But here's the catch. With TF-IDF, the film/movie pair still scores low, because their distinctive words (`film`, `great`, `movie`, `excellent`) are all different. That's the lesson: weighting can only re-rank the words you *share*. It can never discover that two different words mean the same thing.",
      ],
      formula: {
        expr: "tfidf(w, d) = count(w in d) × ln(N / df(w))",
        symbols: [
          { sym: "count(w in d)", meaning: "how often word w appears in document d (the term frequency)" },
          { sym: "N", meaning: "the number of documents in the collection" },
          { sym: "df(w)", meaning: "how many documents contain w at least once" },
          { sym: "ln(N / df)", meaning: "the inverse document frequency: big for rare words, 0 for words in every document" },
        ],
        example: "Our 4 sentences: `the` is in 2 of them, so its weight is ln(4/2) = 0.693; `film` is in 1, so ln(4/1) = 1.386. `film` now counts twice as much as `the`.",
      },
      lab: {
        view: "tfidf",
        label: "TF-IDF",
        task: "Look at the weights in the first sentence: which word matters most? Now add `the` to every line. What happens to its weight, and why?",
      },
    },
    {
      heading: "Where it still wins",
      paragraphs: [
        "Don't write Bag-of-Words off! For **exact terms** (product codes, error messages, names, legal clauses), counting the literal word beats any fuzzy notion of meaning. If a customer searches `ERR-4021`, you want the documents that contain `ERR-4021`, not ones that are vaguely about errors.",
        "That's why modern retrieval systems usually combine a word-count score (BM25) with dense embeddings and get the best of both. Module 09 builds that hybrid and measures it.",
      ],
      lab: {
        view: "keyword-wins",
        label: "Exact terms",
        task: "Search for `ERR-4021`, then `CX-200`, then `my card stopped working`. Which searches does counting words handle perfectly, and which does it fail?",
      },
    },
    {
      heading: "The bridge to embeddings",
      paragraphs: [
        "So how do we fix the meaning problem? Stop giving each word its own private column. Instead, give every word (and later every whole text) a short list of a few hundred numbers, learned so that words used in similar ways get similar numbers. Then `film` and `movie` land close together, and two reviews that share no words can still score high. That's a **dense embedding**, and it's the next step.",
        "But watch carefully what it fixes and what it doesn't. Order is a separate problem, and its fix comes after that: context and attention.",
      ],
      lab: {
        view: "bridge",
        label: "Counts vs meaning",
        task: "Compare word counts with real MiniLM embeddings on each pair. Which pairs does MiniLM fix? Now look at `Dog bites man` vs `Man bites dog`. Did it fix that one?",
      },
    },
  ],
  guided:
    "Before you type anything, predict two scores: `The film was great` vs `The movie was excellent`, and `Dog bites man` vs `Man bites dog`. Check them in **Word counts**. Then try to write a sentence that means the same as `The film was great` but scores 0.",
  build: {
    id: "01-bag-of-words",
    title: "Build Bag-of-Words search from scratch",
    packages: [],
    parts: [
      part("bag-of-words", "p1", "Write `build_vocab(sentences)` and `vectorize(sentence, vocab)`. Your vectors must match the worked example.", [
        "`if w not in vocab: vocab.append(w)` keeps first-seen order.",
        "`[words(sentence).count(w) for w in vocab]`.",
      ]),
      part("bag-of-words", "p2", "Write `cosine(a, b)`, guarding against all-zero vectors.", [
        "`dot = sum(x * y for x, y in zip(a, b))`.",
        "Length: `math.sqrt(sum(x * x for x in a))`. If either length is 0, return 0.0.",
      ]),
      part("bag-of-words", "p3", "Write `rank(query, docs)`: a tiny search engine. Then look at what it does with `Was the movie good?`: the film review and the weather report tie.", [
        "Build `(cosine(q, vectorize(d, vocab)), d)` for each doc.",
        "`sorted(scored, key=lambda t: t[0], reverse=True)`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "bow-not",
      prompt: "What Bag-of-Words cosine do `the food was not good, it was bad` and `the food was not bad, it was good` get?",
      options: ["About 0, because they mean opposite things", "1, because they contain exactly the same words with the same counts", "0.5, because half the words differ", "It can't be computed"],
      correctIndex: 1,
      explanation: "Same words, same counts, different order: the count vectors are identical, so cosine is exactly 1. Order, and with it negation, is invisible to the bag.",
    },
    {
      id: "bow-synonym",
      prompt: "Why does Bag-of-Words score `I loved this film` vs `What a great movie` at 0?",
      options: [
        "Because they have different lengths",
        "Because they share no words, and each word is its own column, so `film` and `movie` (or `loved` and `great`) have nothing in common",
        "Because cosine ignores verbs",
        "Because the vocabulary was too small",
      ],
      correctIndex: 1,
      explanation: "With no shared words the dot product is 0. Nothing in a count vector records that two different words mean similar things; that's what dense embeddings add.",
    },
  ],
  oneSentence:
    "Bag-of-Words turns a text into counts over a vocabulary and compares texts by the cosine of those counts, which captures shared words but loses word order and knows nothing about meaning.",
  deeper: [
    { label: "Jurafsky & Martin, Speech and Language Processing, ch. 6", url: "https://web.stanford.edu/~jurafsky/slp3/6.pdf", adds: "§6.3–6.5: term-document matrices, cosine and TF-IDF, then the move to dense vectors." },
    { label: "scikit-learn: Text feature extraction", url: "https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction", adds: "The standard CountVectorizer and TfidfVectorizer, with the same idea at production scale." },
  ],
};
