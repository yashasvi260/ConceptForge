import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const bagOfWords: DeepLesson = {
  why: [
    "Long before LLMs, people needed computers to compare texts. Which support tickets are about the same problem? Which documents match a search? Which reviews are positive? Each of these needs text turned into numbers you can compare, and the first approach that worked well enough to power real search engines and spam filters was astonishingly blunt: **ignore everything except which words appear, and how often**.",
    "That is **Bag-of-Words**. Pour a sentence's words into a bag, shake it so the order is lost, and count. Two texts are similar if their counts are similar. It is fast, needs no training, and is easy to inspect, which is why ideas from it (such as BM25, a refined word-count score) still sit inside modern search systems; Module 09 uses one.",
    "It is also the clearest way to see what an LLM has to do better. Bag-of-Words cannot tell `Dog bites man` from `Man bites dog`, and it thinks `film` and `movie` have nothing in common. Every later idea in this module (dense embeddings, context, attention) is a fix for one of those two failures. This step builds Bag-of-Words from scratch so you can see both.",
  ],
  worked: [
    {
      kind: "text",
      text: "Take four sentences. The **vocabulary** is every distinct word, in the order first seen: `the film was great movie excellent dog bites man` (9 words). Each sentence becomes 9 counts, one per vocabulary word:",
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
      text: "To compare two rows, use **cosine similarity**: multiply matching entries and add them up (the dot product), then divide by the two rows' lengths. For the film and movie sentences, only `the` and `was` match:",
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
      text: "Read the table as a critic. The two movie reviews mean the same thing but score only 0.5, and all of that comes from `the` and `was`, words that say nothing about the meaning. `Dog bites man` and `Man bites dog` mean opposite things and score a perfect 1. Bag-of-Words measures **shared words**, not shared meaning.",
    },
  ],
  concept: [
    {
      heading: "Vocabulary and count vectors",
      paragraphs: [
        "Building Bag-of-Words takes two passes. First, decide how to split text into words (lowercase it, split on anything that isn't a letter, digit or apostrophe) and collect every distinct word into a **vocabulary** with a fixed order. Second, turn each text into a **count vector**: a list with one entry per vocabulary word, holding how many times that word appears.",
        "Stack the vectors for all your texts and you have a **document-term matrix**: one row per text, one column per word. With a real collection the vocabulary runs to tens of thousands of words and each row is almost all zeros (a sentence uses a handful of them). Vectors like this are called **sparse**, and libraries store only the non-zero entries.",
        "Because the vocabulary comes from the texts you built it on, a new word in a later text has no column at all and is simply ignored. That is one more brittleness: misspellings and new words vanish.",
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
    },
    {
      heading: "Cosine similarity",
      paragraphs: [
        "To compare two vectors we want a score that is high when they point in the same direction, whatever their length. A long document repeats words more often than a short one, but it can still be about the same thing. **Cosine similarity** does exactly that: it is the cosine of the angle between the two vectors. It is 1 when they point the same way, 0 when they share nothing, and (for vectors that can go negative, as dense embeddings can) −1 when they point opposite ways.",
        "You will use cosine similarity in almost every module from here on: comparing embeddings, searching documents, clustering texts, checking retrieval. It is worth knowing by heart.",
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
    },
    {
      heading: "What the bag throws away",
      paragraphs: [
        "**Order.** Shaking the bag destroys word order, so `Dog bites man` and `Man bites dog` become the same vector. Likewise `not good, very bad` and `not bad, very good`. A common partial fix is to count pairs of neighbouring words (**bigrams**) as well, but the vocabulary explodes and the problem only moves.",
        "**Meaning.** Each word is its own column, unrelated to every other column. `film` and `movie` are as different as `film` and `interest`. Two texts that say the same thing in different words get a low score; two texts that share filler words get a high one. That's why the worked example's film/movie score came entirely from `the` and `was`.",
        "Practical systems soften this. They drop very common **stop words** (`the`, `was`, `is`), and weight rare words more than common ones (**TF-IDF**: term frequency × inverse document frequency). These help a lot for search, but they cannot make `film` and `movie` related, because nothing in a count says what a word means.",
      ],
      mistake:
        "Reading a high Bag-of-Words score as \"these texts mean the same\". It only means they use the same words. Synonyms score 0, and filler words, negations and word order can make very different sentences look identical.",
    },
    {
      heading: "TF-IDF: weighting the words that matter",
      paragraphs: [
        "Raw counts treat every word as equally informative, which is why `the` and `was` dominated the film/movie score. **TF-IDF** fixes the weighting. The **term frequency** (TF) is the count you already have. The **inverse document frequency** (IDF) is large for words that appear in few documents and small for words that appear everywhere. Multiply them and common words fade while distinctive words stand out.",
        "With TF-IDF the film/movie pair still scores low, because their distinctive words (`film`, `great`, `movie`, `excellent`) are all different. That is the point: weighting can only re-rank the words you share. It never discovers that two different words mean the same thing.",
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
    },
    {
      heading: "Where it still wins",
      paragraphs: [
        "Bag-of-Words is not obsolete. For **exact terms** (product codes, error messages, names, legal clauses), counting the literal word beats any fuzzy notion of meaning: if a customer searches `ERR-4021`, you want documents containing `ERR-4021`. Modern retrieval systems usually combine a word-count score (BM25) with dense embeddings, and get the best of both. Module 09 builds that hybrid and measures it.",
      ],
    },
    {
      heading: "The bridge to embeddings",
      paragraphs: [
        "The fix for the meaning problem is to stop giving each word its own private column. Instead, give every word (and later every whole text) a short list of a few hundred numbers, learned so that words used in similar ways get similar numbers. Then `film` and `movie` land close together, and two reviews that share no words can still score high. That is a **dense embedding**, the next step. The fix for the order problem comes after that: context and attention.",
      ],
    },
  ],
  guided:
    "Predict first: what will the score be for `The film was great` vs `The movie was excellent`, and for `Dog bites man` vs `Man bites dog`? Type both pairs into the box below and check. Then add a sentence that shares no words with `The film was great` but means the same.",
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
