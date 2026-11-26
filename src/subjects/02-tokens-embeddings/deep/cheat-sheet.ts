import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const cheatSheet: DeepLesson = {
  why: [
    "This module followed text all the way from characters to meaning. A tokenizer cut it into pieces from a learned vocabulary (BPE, WordPiece or Unigram, usually on bytes), wrapped it in special tokens, and turned it into IDs. An embedding table turned each ID into a vector. The transformer's layers made those vectors contextual, and pooling turned them into one vector per sentence, where closeness means similar meaning. Each step is simple on its own; together they are the input half of every language model.",
    "The best way to check that you understand a pipeline is to build something real with it and measure it. The recap does that with the most common application of everything in this module: **semantic search**. Given a customer's question, find the help article that answers it, even when the two share no words. It is the retrieval step of every RAG system (Module 09), and it is a few lines of code once you have sentence vectors.",
    "You will search 12 real banking help questions with 6 real customer queries, all embedded by MiniLM, then evaluate the results with the standard retrieval metrics and compare them with the keyword matching from Module 01. The numbers are small enough to check by hand and real enough to show both the power of embeddings and their failure modes.",
  ],
  worked: [
    {
      kind: "text",
      text: "Embed every help question once and store the 12 unit vectors. For each customer query, embed it, take the dot product with all 12, and rank. Here is the top result for each of the six queries, and the rank at which the labelled correct answer appeared:",
    },
    {
      kind: "table",
      caption: "Embedding search on six labelled queries",
      columns: ["customer query", "top result", "score", "rank of the correct answer"],
      rows: [
        ["I can't sign in to my account", "How do I reset my password?", 0.572, 2],
        ["Somebody took money from me without asking", "I see a payment I don't recognise", 0.558, 1],
        ["transfer funds to another country", "How do I send money abroad?", 0.694, 1],
        ["my debit card is lost, I need a replacement", "How do I order a new debit card?", 0.766, 1],
        ["when is the branch open on Saturday", "What are your branch opening hours?", 0.672, 1],
        ["I was billed two times for one purchase", "My card was charged twice", 0.652, 1],
      ],
      source: "worked/cheat-sheet.py",
    },
    {
      kind: "text",
      text: "Five of six correct at rank 1, with queries that share almost no words with their answers (`transfer funds to another country` → `How do I send money abroad?`). The one miss is arguable: for \"I can't sign in\", the label says \"I forgot my login details\" but the search picked \"How do I reset my password?\", which many people would accept. Now the same queries with keyword overlap:",
    },
    {
      kind: "table",
      caption: "Embeddings vs keyword overlap on the same queries",
      columns: ["method", "hit@1", "hit@3", "MRR"],
      rows: [
        ["MiniLM embeddings", 0.833, 1, 0.917],
        ["keyword overlap (Jaccard)", 0.167, 0.667, 0.456],
      ],
      source: "worked/cheat-sheet.py",
    },
    {
      kind: "math",
      text: "embedding ranks [2, 1, 1, 1, 1, 1]:  MRR = (1/2 + 1 + 1 + 1 + 1 + 1) / 6 = 5.5 / 6 = 0.917\nkeyword ranks   [3, 5, 5, 1, 2, 2]:  MRR = (1/3 + 1/5 + 1/5 + 1 + 1/2 + 1/2) / 6 = 2.733 / 6 = 0.456",
    },
  ],
  concept: [
    {
      heading: "The pipeline, end to end",
      paragraphs: [
        "Text → **tokenizer** → IDs: pre-tokenization rules, then BPE merges (GPT, Llama), greedy WordPiece (BERT, MiniLM) or Unigram's most probable split (T5), on a fixed vocabulary of 30k–200k entries, with special tokens added by the template. IDs → **embedding table** → static vectors: one row per ID, learned during training. Static vectors → **transformer layers** → contextual vectors: each token's vector absorbs its neighbours. Contextual vectors → **pooling** → one unit-length sentence vector. Two sentence vectors → **dot product** → similarity.",
        "Each arrow has a failure mode you have now measured: the token tax for other languages and the digit chunking for numbers (tokenizer), the poorly trained rows of rare tokens (table), only partial sense separation in a small model (contextual vectors), padding leaking into the average (pooling), and scores that still respond to shared words (similarity). Knowing which arrow a problem comes from is most of debugging an embedding system.",
      ],
    },
    {
      heading: "Semantic search",
      paragraphs: [
        "Semantic search has two phases. **Indexing**, done once: split documents into chunks that fit the model's input limit (step 10), embed each chunk, and store the unit vectors with a pointer back to the text. **Querying**, done per request: embed the query with the same model, compute its dot product with every stored vector, and return the top k. With 12 documents that is one tiny matrix product; with millions, vector databases use approximate nearest-neighbour indexes to avoid comparing with every vector (Module 09).",
        "The query and the documents must be embedded by the **same model**, with the same pooling and normalisation: vectors from different models live in unrelated spaces and their dot products mean nothing. Some models are also trained with different prefixes or instructions for queries and documents; when a model card asks for them, leaving them out quietly lowers quality.",
      ],
      formula: {
        expr: "score(query, doc) = e(query) · e(doc)          top-k = the k documents with the highest scores",
        symbols: [
          { sym: "e(text)", meaning: "the model's unit-length sentence vector for the text" },
          { sym: "·", meaning: "dot product, equal to cosine similarity for unit vectors" },
        ],
        example: "e(transfer funds to another country) · e(How do I send money abroad?) = 0.694, the highest of the 12.",
      },
    },
    {
      heading: "Running it in practice",
      paragraphs: [
        "The costs fall in different places. Indexing runs the embedding model once per chunk, which is the expensive part, but it happens ahead of time and can be batched. Each query costs one forward pass for the query plus a dot product per stored vector, which is cheap: a million 384-number vectors are about 1.5 GB in float32 (step 13) and a full scan is one large matrix-vector product. Storing the chunk text next to its vector lets you show or quote the source of every result.",
        "The index has to follow the data. When a document changes, re-embed its chunks; when a document is deleted, remove its vectors, or search will keep returning text that no longer exists. When you change the chunking rules or the embedding model, re-embed everything, because vectors made under different settings are not comparable. Keeping the model name and settings next to the stored vectors makes those mistakes easy to catch.",
      ],
    },
    {
      heading: "Measuring retrieval",
      paragraphs: [
        "You cannot judge search by trying a few queries and nodding. Build a small labelled set (real queries, each with the document that should be found) and compute metrics from the rank at which the right document appears. **hit@k** is the share of queries whose answer is in the top k; it matters when you pass the top k to a model or a person. **MRR**, mean reciprocal rank, averages 1/rank, rewarding answers that come first and penalising those that come lower.",
        "Labels are judgements, and imperfect ones. The single \"miss\" above returned a password-reset article for a sign-in problem, which a reviewer might mark correct. Looking at the misses one by one, not just the averages, tells you whether you have a model problem, a data problem or a labelling problem. Six queries illustrate the method; a real evaluation needs at least dozens per kind of question.",
      ],
      formula: {
        expr: "hit@k = (1/N) Σ_q [rank_q ≤ k]          MRR = (1/N) Σ_q 1 / rank_q",
        symbols: [
          { sym: "rank_q", meaning: "position of the correct document for query q (1 = first)" },
          { sym: "N", meaning: "number of labelled queries" },
        ],
        example: "Ranks [2, 1, 1, 1, 1, 1]: hit@1 = 5/6, hit@3 = 6/6, MRR = 5.5/6 = 0.917.",
      },
      mistake: "Evaluating only on queries that reuse the documents' wording. Keyword search looks fine on those; the queries that matter are the ones users actually type, which often share no words with the answer.",
    },
    {
      heading: "When keywords still win",
      paragraphs: [
        "On these paraphrased queries, embeddings beat keyword overlap easily (MRR 0.917 vs 0.456). But keyword methods, especially the refined BM25 score, remain strong in practice: on benchmarks covering many kinds of search, BM25 is a hard baseline to beat for models used outside their training domain. They win on exact strings that embeddings blur: product codes, error messages, names, account numbers, rare technical terms.",
        "That is why production systems usually combine both (hybrid search) and then re-rank the top candidates with a stronger, slower model. Module 09 builds that full retrieval pipeline. Before that, Module 03 opens the transformer itself, to show how the layers between the embedding table and the output turn static vectors into contextual ones.",
      ],
    },
  ],
  guided:
    "In **Search**, type a question that uses different words from every document (for example \"I can't sign in to my account\") and predict the top result before you press enter. Then open the **Cheat sheet**, cover the right column, and explain each term out loud.",
  build: {
    id: "m02-recap-search",
    title: "Mini-project: semantic search, measured",
    packages: ["numpy"],
    data: "minilm",
    parts: [
      part("cheat-sheet", "p1", "Write `search`: score every document by dot product with the query vector and return the top k.", [
        "`scores = D @ query_vec` gives all 12 scores at once.",
        "`np.argsort(-scores)[:k]` gives the indices of the k highest.",
      ]),
      part("cheat-sheet", "p2", "Evaluate the search on six labelled queries: the rank of each correct answer, then hit@1, hit@3 and MRR.", [
        "Rank everything with `search(query_vec, D, len(D))` and use `order.index(gold) + 1`.",
        "hit@k is `sum(r <= k for r in ranks) / len(ranks)`; MRR is the average of `1 / r`.",
      ]),
      part("cheat-sheet", "p3", "Build the keyword baseline from Module 01 (word-overlap Jaccard score) and compare it with embeddings on the same queries.", [
        "`len(q & d) / len(q | d)` with `q` and `d` as word sets.",
        "`sorted(range(len(docs)), key=lambda i: -scores[i])` keeps document order for ties.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-recap-same-model",
      prompt: "You embedded your help articles with MiniLM last year and now embed incoming queries with a newer, better model. What happens?",
      options: [
        "Search improves because the query vectors are better",
        "Scores become meaningless: vectors from different models live in different spaces, so documents must be re-embedded",
        "Nothing changes",
        "Only long queries are affected",
      ],
      correctIndex: 1,
      explanation: "A dot product only compares vectors from the same model (and pooling). Changing the embedding model means re-indexing every document.",
    },
    {
      id: "m02-recap-metric",
      prompt: "Your RAG system passes the top 3 retrieved chunks to the model. Which metric best predicts whether the model sees the right chunk?",
      options: ["hit@1", "hit@3", "The average similarity score", "The number of documents"],
      correctIndex: 1,
      explanation: "If the answer is anywhere in the top 3, the model receives it. hit@3 counts exactly that; MRR and hit@1 also reward ordering.",
    },
    {
      id: "m02-recap-keywords",
      prompt: "Users search for exact error codes like `ERR_CERT_DATE_INVALID`. Why might pure embedding search disappoint?",
      options: [
        "Embeddings cannot represent capital letters",
        "Exact rare strings are blurred into general meaning, while keyword matching finds the identical string directly",
        "Error codes are too short to tokenize",
        "Embedding models refuse technical text",
      ],
      correctIndex: 1,
      explanation: "Embeddings capture meaning and blur exact identifiers; keyword methods such as BM25 excel at them. Hybrid search uses both (Module 09).",
    },
  ],
  oneSentence:
    "Text becomes tokens, tokens become table rows, layers make them contextual and pooling makes one unit vector per sentence; ranking documents by dot product with a query's vector gives semantic search, which you must evaluate with labelled queries (hit@k, MRR) and often combine with keywords.",
  deeper: [
    {
      label: "Sentence Transformers: semantic search",
      url: "https://www.sbert.net/examples/applications/semantic-search/README.html",
      adds: "Semantic search in Python with real models, including faster search for large collections.",
    },
    {
      label: "Thakur et al. 2021, BEIR",
      url: "https://arxiv.org/abs/2104.08663",
      adds: "A benchmark of many search tasks showing when embeddings beat BM25 and when they do not.",
    },
    {
      label: "all-MiniLM-L6-v2 model card",
      url: "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2",
      adds: "The model used for every vector in this module, its intended uses and limits.",
    },
  ],
};
