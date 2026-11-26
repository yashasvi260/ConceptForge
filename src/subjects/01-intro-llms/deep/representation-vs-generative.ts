import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const representationVsGenerative: DeepLesson = {
  why: [
    "You now know two kinds of model output: a **vector** (from an encoder such as MiniLM) and **text** (from a decoder such as GPT or Llama). In practice this is the first design decision in almost every LLM project. Do I need numbers I can compute with (compare, cluster, search, feed to a classifier) or words a person will read (an answer, a summary, an email)?",
    "Take a bank's support inbox. Routing 50,000 tickets a day to the right team is a job for vectors: embed each ticket, compare it with examples of each team's tickets, send it to the closest. That costs a fraction of a cent and takes milliseconds. Writing a reply to the customer is a job for text: a generative model reads the ticket and writes. Using a large generative model for routing works too, but it costs thousands of times more compute per ticket and is slower and harder to audit. Using an embedding model to write replies is impossible: it has no way to produce text.",
    "This step makes the choice concrete with real MiniLM vectors. You will build a working classifier from a handful of labelled examples, then price it against asking an LLM.",
  ],
  worked: [
    {
      kind: "text",
      text: "**Representation: classify by nearest centroid.** Label a few tickets per class: login (`How do I reset my password?`, `I forgot my login details`), payments (`My card was charged twice`), movies (`The film was great`). Each class's **centroid** is the average of its examples' MiniLM vectors. A new ticket goes to the class whose centroid it is closest to:",
    },
    {
      kind: "table",
      caption: "Nearest-centroid classification with MiniLM vectors",
      columns: ["new ticket", "login", "payments", "movies", "predicted"],
      rows: [
        ["I can't sign in to my account", 0.604, 0.233, -0.026, "login"],
        ["I see a payment I don't recognise", 0.209, 0.395, -0.032, "payments"],
        ["The movie was excellent", 0.036, 0.106, 0.891, "movies"],
      ],
      source: "worked/representation-vs-generative.py",
    },
    {
      kind: "text",
      text: "All three are right, from four labelled examples and no training at all. None of the new tickets shares its key words with its class examples (`sign in` vs `password`/`login`; `payment … recognise` vs `card … charged`). **Generative: ask the model.** The alternative is a prompt like `Classify this ticket as login, payments or movies: I can't sign in to my account. Answer:` sent to a decoder, which writes `login`. It needs no examples and can explain itself. Here is what each costs in compute, using the 2 × parameters × tokens rule from the training step:",
    },
    {
      kind: "table",
      caption: "Rough compute for one 10-token ticket",
      columns: ["approach", "floating-point operations"],
      rows: [
        ["embed with MiniLM (22.7 M weights, 10 tokens)", "4.5e+08"],
        ["ask an 8 B decoder (60-token prompt + 2-token answer)", "1.0e+12"],
        ["ratio", "2,192×"],
      ],
      source: "worked/representation-vs-generative.py",
    },
  ],
  concept: [
    {
      heading: "Two jobs, two kinds of output",
      paragraphs: [
        "A **representation model** maps text to a vector. You never read its output; you compute with it. Its whole value is in the geometry: similar texts near each other, so that similarity, search, clustering and classification become arithmetic. It is typically an encoder, small (tens to hundreds of millions of weights) and fast.",
        "A **generative model** maps text to more text, one token at a time. Its output is meant to be read, by a person or by another program that parses it. It is typically a decoder, large (billions of weights) and slower, because it runs once per output token. It can do things vectors cannot: explain, summarise, reason step by step, follow instructions, write code.",
      ],
    },
    {
      heading: "Classifying with vectors",
      paragraphs: [
        "The worked example used the simplest vector classifier: **nearest centroid**. It needs only a few labelled examples per class and no training, and new classes can be added by adding examples. With more data you would train a small classifier on top of the vectors (a logistic-regression head, Module 04), which learns which directions in the vector space matter for your labels and is usually more accurate.",
        "Either way the heavy model (the encoder) is frozen and reused; only a tiny piece on top is fitted to your task. That is cheap, fast to update, and easy to inspect: you can look at which examples a ticket was closest to and see why it was routed where it was.",
      ],
      formula: {
        expr: "cₖ = mean(embed(x) for x in examplesₖ)        label(t) = argmaxₖ cos(embed(t), cₖ)",
        symbols: [
          { sym: "cₖ", meaning: "the centroid of class k: the average of its examples' vectors" },
          { sym: "embed", meaning: "the representation model (MiniLM here)" },
          { sym: "argmaxₖ", meaning: "the class whose centroid is most similar" },
        ],
        example: "`I can't sign in to my account`: cos with login 0.604, payments 0.233, movies −0.026 → login.",
      },
    },
    {
      heading: "Classifying with a generative model",
      paragraphs: [
        "A generative model classifies by being asked. You describe the labels in the prompt (**zero-shot**) or include a few labelled examples (**few-shot**), and it writes the label. This needs no training data, handles labels that are hard to define by examples (\"tickets where the customer sounds like they might leave\"), and can return a reason along with the label.",
        "The costs are real. Every ticket runs a billion-parameter model over a long prompt. The output is text, so you must parse it and handle answers that don't match any label. And probabilities are less direct: you get a confidence only by reading the token probabilities, which Module 04 does with real recorded outputs.",
      ],
      mistake:
        "Reaching for the biggest generative model for every task because it is the most capable. For high-volume tasks whose output is a label, a score or a match, an embedding model plus a small classifier is usually faster, far cheaper and easier to audit, and often just as accurate.",
    },
    {
      heading: "The cost gap, in numbers",
      paragraphs: [
        "Using the forward-pass rule of about 2 operations per parameter per token: embedding a 10-token ticket with MiniLM costs about 4.5 × 10⁸ operations. Asking an 8B decoder with a 60-token prompt and a 2-token answer costs about 1.0 × 10¹² operations, roughly 2,200 times more. At 50,000 tickets a day that is the difference between a laptop and a GPU server.",
        "The estimate is rough (it ignores attention's cost on long prompts and the hardware's efficiency), but the order of magnitude is what drives architecture decisions, and it does not change.",
      ],
    },
    {
      heading: "Choosing in practice",
      paragraphs: [
        "Four questions settle most cases. **What is the output?** A label, score, match or ranking points to vectors; words for a person point to generation. **How many items?** Thousands per hour or more favours vectors; a few dozen interactive requests can afford an LLM. **Do you have examples?** A few labelled examples per class is enough for a centroid classifier, and a few hundred for a trained head; with none, a zero-shot prompt is the quickest start. **Must it explain itself?** If every decision needs a written justification, generation earns its cost.",
        "A good habit is to prototype with an LLM prompt (fast to try, no data needed), measure its accuracy on a small labelled set, and then check whether an embedding classifier matches it for a fraction of the cost. Module 04 runs exactly that comparison on real banking tickets.",
      ],
    },
    {
      heading: "Combining them",
      paragraphs: [
        "Real systems use both, each where it is strong. **Retrieval-augmented generation** (Module 08) embeds a question, uses vectors to find the few most relevant documents out of millions, and only then asks a generative model to write an answer from those documents. **Cascades** route the easy, confident cases with a cheap classifier and send only the uncertain ones to an LLM. **Labelling** uses an LLM once to label a training set, then trains a small fast classifier on those labels. The pattern is always the same: vectors for scale, generation for language.",
      ],
    },
  ],
  guided:
    "Predict first: for `This movie was fantastic, I loved every minute!`, which label sentence will MiniLM put closer, the positive or the negative one? Edit the review below. Then write a sarcastic review and see whether the vector still gets it right.",
  build: {
    id: "01-rep-vs-gen",
    title: "A working classifier from four examples, and its price",
    packages: ["numpy"],
    data: "minilm",
    parts: [
      part("representation-vs-generative", "p1", "Write `centroid(sentences)`: the average of the sentences' real MiniLM vectors.", [
        "`[vectors[s] for s in sentences]` gives a list of 384-number arrays.",
        "`np.mean(list_of_arrays, axis=0)` averages them position by position.",
      ]),
      part("representation-vs-generative", "p2", "Write `classify(text)`: score the text against every centroid and return the best label. All three unseen tickets must land in the right class.", [
        "`{label: cos(v, c) for label, c in centroids.items()}`.",
        "`max(scores, key=scores.get)` is the best label.",
      ]),
      part("representation-vs-generative", "p3", "Write `forward_flops(n_params, n_tokens)` and compare embedding against asking an 8B model.", ["About 2 operations per parameter per token.", "`2 * n_params * n_tokens`."]),
    ],
  },
  local: [],
  checks: [
    {
      id: "rg-dedupe",
      prompt: "You must find near-duplicate complaints among 3 million records. Which approach fits?",
      options: [
        "Ask a large generative model to compare every pair",
        "Embed every record once with a representation model and look for pairs with very high cosine",
        "Use Bag-of-Words only",
        "Fine-tune a generative model first",
      ],
      correctIndex: 1,
      explanation: "Comparing pairs with an LLM would mean trillions of calls. Embedding each record once and comparing vectors is fast, cheap and exactly what representation models are for.",
    },
    {
      id: "rg-reply",
      prompt: "A customer needs a personalised explanation of why a payment was declined. Which kind of model must write it?",
      options: ["A representation model: it returns the closest explanation vector", "A generative model: only it can produce new text", "Either, they are interchangeable", "Neither; use Bag-of-Words"],
      correctIndex: 1,
      explanation: "Representation models output vectors, not text. Writing requires a generative model, which can be combined with vectors that first retrieve the relevant policy (Module 08).",
    },
  ],
  oneSentence:
    "Representation models turn text into vectors you compute with (cheap, fast, ideal for search, grouping and classification), while generative models turn text into text you read (expensive, flexible, needed for writing), and good systems use each where it is strong.",
  deeper: [
    { label: "Reimers & Gurevych 2019, Sentence-BERT", url: "https://arxiv.org/abs/1908.10084", adds: "Why using a generative-style cross-comparison for search is impractically slow, and how sentence vectors fix it." },
    { label: "Sentence Transformers documentation", url: "https://www.sbert.net/", adds: "Ready-made embedding models and examples for search, clustering and classification." },
  ],
};
