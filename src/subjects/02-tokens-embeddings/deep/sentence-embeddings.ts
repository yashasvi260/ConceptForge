import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const sentenceEmbeddings: DeepLesson = {
  why: [
    "Many of the most useful things you can do with a language model need one vector per **text**, not per token: finding the support article that answers a question, grouping thousands of customer comments by topic, spotting duplicate tickets, recommending similar documents. A transformer produces one contextual vector per token, so something has to turn a sentence's 7 or 30 token vectors into a single vector that stands for the whole sentence.",
    "The common answer is almost embarrassingly simple: **average them**, then scale the result to length 1. That is called mean pooling, and it is exactly what MiniLM, the model running in this page, does. What makes it work is not the averaging but the training: sentence-embedding models are fine-tuned on very large numbers of sentence pairs so that the averaged vectors of related sentences end up close together. Without that training, averaged vectors from a plain model are much less useful for similarity.",
    "With one unit-length vector per sentence, comparing texts becomes a dot product, and comparing all of them at once becomes a single matrix product. That is the engine behind semantic search (step 14 and Module 09), classification by similarity (Module 06) and clustering (Module 07). This step rebuilds MiniLM's sentence vectors from its real token vectors, shows why padding must be masked, and reads a similarity matrix of real banking questions critically.",
  ],
  worked: [
    {
      kind: "text",
      text: "MiniLM produced 8 token vectors for `I forgot my login details` (`[CLS] i forgot my log ##in details [SEP]`) and, separately, its own sentence vector. Pool the token vectors three different ways and compare each with MiniLM's own sentence vector (cosine 1.0 = identical direction):",
    },
    {
      kind: "table",
      caption: "Three ways to pool one sentence, against MiniLM's own sentence vector",
      columns: ["pooling", "cosine with MiniLM's sentence vector"],
      rows: [
        ["mean of all tokens, incl. [CLS] and [SEP]", 1],
        ["mean of the word pieces only", 0.9737],
        ["the [CLS] vector alone", 0.4497],
      ],
      source: "worked/sentence-embeddings.py",
    },
    {
      kind: "text",
      text: "Averaging every position, special tokens included, reproduces MiniLM's vector exactly. Dropping the specials gives a slightly different vector, and taking `[CLS]` alone (a common choice for other BERT models) gives a very different one. The right pooling is whatever the model was trained with. Now compare 12 real banking questions with each other; here are the three most similar pairs and the two least similar:",
    },
    {
      kind: "table",
      caption: "Most and least similar pairs among 12 banking questions",
      columns: ["question A", "question B", "cosine"],
      rows: [
        ["How do I reset my password?", "I forgot my login details", 0.576],
        ["How do I order a new debit card?", "How do I set up a direct debit?", 0.556],
        ["I forgot my login details", "Where can I find my account number?", 0.519],
        ["I forgot my login details", "What is the interest rate on my mortgage?", 0.023],
        ["How do I send money abroad?", "What are your branch opening hours?", 0.009],
      ],
      source: "worked/sentence-embeddings.py",
    },
  ],
  concept: [
    {
      heading: "Mean pooling",
      paragraphs: [
        "Mean pooling takes the n token vectors of a sentence and averages them position by position, giving one vector of the same width (384 for MiniLM). MiniLM then **normalises** the result, dividing by its length so that it has length 1. Every sentence, short or long, ends up as a point on the same unit sphere.",
        "Why should an average mean anything? Because by the last layer each token's vector already carries information about the whole sentence (step 12), so averaging keeps what the tokens share and cancels much of what is specific to single positions. Training then makes that average useful: the model's weights are adjusted until the averaged vectors of paraphrases point the same way. The result is compact. One MiniLM sentence vector is 384 numbers, 1,536 bytes in float32, so a million sentences take about 1.5 GB, small enough to search on one machine.",
        "Other pooling choices exist: the `[CLS]` vector (BERT's classification position), the maximum of each dimension across tokens, or a weighted average. None is correct in general. A sentence-embedding model is trained with one particular pooling, and using a different one at inference gives vectors the model was not optimised for: in the worked example, `[CLS]` alone points in a substantially different direction from MiniLM's real sentence vector (cosine 0.45). Check the model card; for sentence-transformers models the pooling is stored in the model's configuration and applied for you.",
      ],
      formula: {
        expr: "s = mean_i(h_i · m_i) = Σ_i m_i h_i / Σ_i m_i          sentence vector = s / ‖s‖",
        symbols: [
          { sym: "h_i", meaning: "the contextual vector at position i (step 12)" },
          { sym: "m_i", meaning: "the attention mask: 1 for real tokens, 0 for padding" },
          { sym: "‖s‖", meaning: "the vector's length; dividing by it gives length 1" },
        ],
        example: "For `I forgot my login details`, averaging all 8 rows and normalising gives MiniLM's sentence vector exactly (cosine 1.0).",
      },
    },
    {
      heading: "Masks: padding must not leak in",
      paragraphs: [
        "Models embed many sentences at once, so short sentences are padded to the batch's longest (step 8). The model still produces an output vector at every padded position, and those vectors are not zero. If you average every row, they leak into the sentence vector, and the same sentence gets a different vector depending on what it was batched with. Multiplying by the attention mask before summing, and dividing by the number of real tokens, removes them.",
        "Libraries do this for you, but code that pools hidden states by hand is a common source of subtle bugs: results that change with batch size, or search quality that drops when documents are embedded in larger batches. Part 2 shows the leak and the fix.",
      ],
      mistake: "Pooling with `vectors.mean(axis=1)` over a padded batch. Use the mask: `(X * mask[..., None]).sum(1) / mask.sum(1, keepdims=True)`.",
    },
    {
      heading: "Similarity: dot products on unit vectors",
      paragraphs: [
        "Cosine similarity divides the dot product by both vectors' lengths. When every vector already has length 1, the division does nothing, so cosine similarity **is** the dot product. Comparing one query with a million stored sentence vectors is then a single matrix-vector product, and comparing every pair among n sentences is the matrix product D · Dᵀ, an n × n table of similarities. That is why sentence-embedding models normalise, and why vector databases store unit vectors and search by dot product (Module 09).",
        "The numbers are relative. Among the 12 banking questions, the closest pair scores 0.576 and unrelated pairs sit near 0. There is no universal threshold for \"same meaning\": it depends on the model and on what your texts look like, so you calibrate by checking scores on pairs you have labelled yourself.",
      ],
      formula: {
        expr: "cos(a, b) = a · b / (‖a‖ ‖b‖) = a · b   when ‖a‖ = ‖b‖ = 1          all pairs: C = D Dᵀ",
        symbols: [
          { sym: "D", meaning: "the matrix of unit sentence vectors, one row per sentence (12 × 384 here)" },
          { sym: "C[i, j]", meaning: "the similarity of sentence i and sentence j" },
        ],
        example: "C[reset my password, forgot my login details] = 0.576, the highest of the 66 pairs.",
      },
    },
    {
      heading: "What the scores capture, and what they miss",
      paragraphs: [
        "The top pair shares almost no words (`How do I reset my password?` and `I forgot my login details`), yet scores highest: the model learned that both are about getting into an account. That is the strength of sentence embeddings over word counts (Module 01's bag-of-words).",
        "The second pair is a warning. `How do I order a new debit card?` and `How do I set up a direct debit?` are different tasks, but they share `debit` and the `How do I …` pattern, and score 0.556. Sentence vectors still respond to surface overlap, and they also struggle with negation (\"I can log in\" vs \"I can't log in\") and with exact details such as amounts and dates. For search, that is why systems combine vector similarity with keyword matching and re-check the top results with a stronger model (Module 09).",
        "Two more limits are worth knowing. MiniLM reads at most 256 word pieces and silently truncates the rest, so long documents must be chunked (step 10). And a sentence-embedding model is only as good as its training pairs: MiniLM was trained on over a billion sentence pairs from the web, so specialised domains may need a fine-tuned model (Module 12).",
      ],
    },
  ],
  guided:
    "In **Mean pooling**, watch the token rows being averaged into the sentence vector at the bottom. Then switch to **Similarity matrix**, add two sentences that share words but mean different things, and two that mean the same thing in different words, and compare their scores.",
  build: {
    id: "m02-sentence-embeddings",
    title: "Rebuild MiniLM's sentence vectors and compare them",
    packages: ["numpy"],
    data: "minilm",
    parts: [
      part("sentence-embeddings", "p1", "Write masked mean pooling and reproduce MiniLM's real sentence vectors from its real token vectors.", [
        "`(X * m[:, None]).sum(axis=0) / m.sum()` averages only the rows where the mask is 1.",
        "Divide by `np.linalg.norm(mean)` to get length 1.",
      ]),
      part("sentence-embeddings", "p2", "Pad two sentences into one batch, then show that masked pooling is unaffected while averaging every row lets padding leak in.", [
        "`X[i, : len(rows)] = rows` copies a sentence's rows; `mask[i, : len(rows)] = 1` marks them as real.",
        "Everything not overwritten keeps `pad_vector`, the stand-in for the model's output at a padded position.",
      ]),
      part("sentence-embeddings", "p3", "Compute the similarity matrix of 12 real banking questions with one matrix product, and find the most similar pairs.", [
        "For unit vectors, `D @ D.T` is the cosine-similarity matrix.",
        "Collect `(C[i, j], i, j)` for `i < j` and `sorted(..., reverse=True)[:k]`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-sent-pooling",
      prompt: "You use a sentence-embedding model but take the `[CLS]` vector instead of the mean pooling it was trained with. What happens?",
      options: [
        "Nothing: all pooling methods give the same vector",
        "You get vectors the model was not optimised for, and similarity quality drops",
        "The vectors become longer",
        "The model refuses to run",
      ],
      correctIndex: 1,
      explanation: "For MiniLM the `[CLS]` vector alone has a cosine of only 0.45 with the real sentence vector. Use the pooling the model was trained with.",
    },
    {
      id: "m02-sent-dot",
      prompt: "Why can a vector database rank sentence embeddings by plain dot product?",
      options: [
        "Dot product is more accurate than cosine",
        "The vectors are normalised to length 1, so the dot product equals the cosine similarity",
        "Dot product ignores the vectors' directions",
        "Vector databases cannot compute cosine",
      ],
      correctIndex: 1,
      explanation: "cos(a, b) = a·b / (‖a‖‖b‖), and with unit vectors the denominator is 1. That turns search into fast matrix products.",
    },
    {
      id: "m02-sent-limits",
      prompt: "`How do I order a new debit card?` and `How do I set up a direct debit?` score 0.556, the second-highest pair. What does this show?",
      options: [
        "They mean the same thing",
        "Sentence vectors still respond to shared words and phrasing, so high similarity is not proof of the same meaning",
        "MiniLM is broken",
        "Similarity above 0.5 always means a duplicate",
      ],
      correctIndex: 1,
      explanation: "They are different tasks that share `debit` and `How do I …`. That is why search systems combine vectors with keyword signals and re-check top results (Module 09).",
    },
  ],
  oneSentence:
    "A sentence vector is the masked mean of a model's contextual token vectors, normalised to length 1 (exactly MiniLM's recipe), which turns similarity into a dot product; scores are relative, respond to meaning and still partly to shared words.",
  deeper: [
    {
      label: "Reimers & Gurevych 2019, Sentence-BERT",
      url: "https://arxiv.org/abs/1908.10084",
      adds: "Why plain BERT vectors are poor for similarity, and how training on sentence pairs with mean pooling fixes it.",
    },
    {
      label: "all-MiniLM-L6-v2 model card",
      url: "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2",
      adds: "The model used here: its mean pooling, 384-number vectors, 256-word-piece limit and 1B-pair training data.",
    },
    {
      label: "Sentence Transformers documentation",
      url: "https://www.sbert.net/",
      adds: "The library that runs these models in Python, with guides for semantic search, clustering and choosing a model.",
    },
  ],
};
