import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const staticVsContextual: DeepLesson = {
  why: [
    "The embedding table gives every token one fixed vector. Can you spot the problem? Think of any word with more than one meaning. `bank` in \"the bank approved the loan\" and \"the river bank flooded\" gets the identical row, so at the input the model can't tell a lender from a riverside. A vector that stays the same in every sentence is called **static**, and static vectors (from the table, or from older methods like word2vec) carry every sense of a word blended together.",
    "Transformers fix this in their layers. Each layer lets every token's vector take in information from the other tokens in the sentence (attention, Module 03), so by the output, `bank` near `loan` and `bank` near `river` have moved in different directions. Those output vectors are **contextual**: a fresh vector for each word in each sentence. Contextual vectors are what made BERT-era models so much better at understanding text.",
    "In this step you'll measure the effect on real MiniLM vectors, and be honest about its size. The two copies of `the` in one sentence stop being identical. The two river sentences' `bank`s end up closest to each other. But MiniLM is a small model tuned for sentence similarity, and the money and river senses separate only partly. Knowing what contextual vectors do, and don't, guarantee is what lets you use them well.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's measure. Here is MiniLM's real output vector for `bank` in four sentences, two about money and two about rivers. Every pair would score exactly 1.0 with a static table (same ID, same row). The contextual vectors:",
    },
    {
      kind: "table",
      caption: "Cosine similarity of the four real bank vectors",
      columns: ["bank in …", "approved the loan", "deposited cash", "river bank flooded", "picnic, river bank"],
      rows: [
        ["approved the loan", 1, 0.806, 0.826, 0.758],
        ["deposited cash", 0.806, 1, 0.757, 0.78],
        ["river bank flooded", 0.826, 0.757, 1, 0.902],
        ["picnic, river bank", 0.758, 0.78, 0.902, 1],
      ],
      source: "worked/static-vs-contextual.py",
    },
    {
      kind: "text",
      text: "What do you see? The river pair is the closest pair in the table (0.902). On average, same-sense pairs score 0.854 and different-sense pairs 0.780. But look at the first row: the loan sentence's `bank` is slightly closer to \"the river bank flooded\" (0.826) than to \"deposited cash\" (0.806). The senses separate, partly. Now compare a static table with contextual vectors for repeated tokens:",
    },
    {
      kind: "table",
      caption: "Static table vs contextual vectors for the same token",
      columns: ["token pair", "static table", "contextual (MiniLM)"],
      rows: [
        ["the (positions 1 and 4, same sentence)", 1, 0.907],
        ["bank: approved the loan vs river bank flooded", 1, 0.826],
        ["bank: approved the loan vs deposited cash", 1, 0.806],
        ["bank: river bank flooded vs picnic, river bank", 1, 0.902],
      ],
      source: "worked/static-vs-contextual.py",
    },
  ],
  concept: [
    {
      heading: "Static vectors: one point per word",
      paragraphs: [
        "A static embedding gives each vocabulary entry a single vector, used in every sentence. That's what the embedding table holds (step 11), and it's what classic word-vector methods produced: word2vec (2013) and GloVe (2014) trained tables in which words used in similar contexts sit close together, and those tables powered search and classification for years.",
        "But the limitation is built in. A word with several senses (`bank`, `bat`, `spring`, `bass`) gets one vector, which ends up as a blend of all its uses, weighted by how often each occurs. A sentence about a riverbank and one about a loan both start from that same blend. Static vectors can't reflect grammar or negation either: `good` has the same vector in \"good service\" and \"not good service\".",
      ],
      lab: {
        view: "static-contextual",
        label: "Static vs contextual",
        task: "Compare the static row for `bank` with the contextual vectors from two sentences. Which part is identical, and which part moved?",
      },
    },
    {
      heading: "Contextual vectors: one point per word, per sentence",
      paragraphs: [
        "In a transformer, the static vector is only the starting point. Every layer updates each token's vector using the vectors of the other tokens (attention), plus a small network applied to each position (Module 03). After several layers, each output vector encodes the token **and** its context. ELMo (2018) showed the value of contextual vectors with recurrent networks; BERT (2018) made them the standard with transformers.",
        "You can see the mixing in the data. Inside `The bank approved the loan`, MiniLM's output vector for `bank` is closest to the vector for `loan` (0.61 cosine), and the two copies of `the`, identical at the input, end with a cosine of 0.907, because each has absorbed a different neighbourhood. Nothing was looked up differently; the layers made the difference.",
        "In code, contextual vectors are the model's hidden states. With Hugging Face Transformers, running `AutoModel` on tokenized input returns `last_hidden_state`, an array of shape (batch × tokens × d); passing `output_hidden_states=True` also returns every layer's version. Two practical details: the rows include `[CLS]` and `[SEP]`, and a word split into several pieces (`em ##bed ##ding ##s`) has one row per piece. To get one vector per word, you usually average its pieces' rows, using the tokenizer's word-to-piece mapping to find them.",
        "Keep in mind that contextual vectors are computed, not stored. To get them you have to run the model on the whole sentence, so they cost a forward pass every time, unlike a table lookup. That's the price of context, and the reason systems compute sentence vectors once and store them (step 13 and Module 09).",
      ],
      formula: {
        expr: "static:      v(word) = E[id(word)]                      (same in every sentence)\ncontextual:  h_i = Layers(E[id_1], …, E[id_n])_i          (depends on every token in the sentence)",
        symbols: [
          { sym: "E[id]", meaning: "the embedding table's row for a token" },
          { sym: "Layers(…)_i", meaning: "the transformer's output at position i, after attention has mixed in the other tokens" },
        ],
        example: "Both `the`s start as row 1,996; their outputs h₁ and h₄ have a cosine of 0.907.",
      },
      lab: {
        view: "bank-shift",
        label: "Bank shift",
        task: "Change Sentence B to another river sentence, then a money sentence. Predict whether the score goes up or down before it appears.",
      },
    },
    {
      heading: "Reading cosine similarities honestly",
      paragraphs: [
        "Cosine similarity measures the angle between two vectors: 1 means the same direction, 0 unrelated (perpendicular), −1 opposite. So is 0.78 high? On its own, you can't tell. Researchers found that vectors from models like BERT and GPT-2 all point into a fairly narrow cone, so even unrelated words often score well above zero; Ethayarajh (2019) measured this and called it anisotropy. MiniLM's last layer behaves better: 30 pairs of different words taken from two unrelated sentences average just 0.07 here. But every `bank` pair scores at least 0.757, whatever the sense, simply because it's the same word.",
        "So compare against a baseline instead of reading values in isolation. Here, same-sense pairs average 0.854 and different-sense pairs 0.780: a real gap, but a small one. Try to draw a line between them and you'll find no threshold gets all six pairs right, because the loan sentence's `bank` sits closer to the flooded river (0.826) than to the cash deposit (0.806). Other models, and other layers of the same model, can behave quite differently, which is worth testing on your own task before relying on any one of them.",
      ],
      mistake:
        "Treating a cosine of 0.8 as \"very similar\" in general. Similarity is relative to the model and the vectors' baseline: calibrate with pairs you know are related and unrelated before you set a threshold.",
      lab: {
        view: "cos-baseline",
        label: "Baseline & threshold",
        task: "Move the threshold and try to judge all six `bank` pairs correctly. What's the best you can do? Compare every score with the 0.07 baseline at the top.",
      },
    },
    {
      heading: "Why MiniLM separates senses only partly",
      paragraphs: [
        "Why is the separation only partial? MiniLM (all-MiniLM-L6-v2) is a small model, 6 layers and 384 numbers per vector, and it was fine-tuned for one job: making **sentence** vectors of similar sentences close. Nothing in that training asks individual word vectors to separate senses cleanly, and its last layer's token vectors are optimised to be averaged into a sentence vector. With half as many layers as BERT-base's twelve, it also has fewer steps in which to mix context into each token. Partial separation is the expected result.",
        "So if your task really is about word senses (for example, disambiguating terms in legal or medical text), use a model trained for token-level tasks, and measure separation on examples from your own domain, as part 2 does here. For comparing whole sentences, which is what search and clustering need, MiniLM's design is exactly right, and step 13 shows how its token vectors become one sentence vector.",
      ],
      lab: {
        view: "sense-by-example",
        label: "Sense by example",
        task: "Each `bank` is labelled with the sense of its nearest neighbour. How many of the four come out right, and which one fails?",
      },
    },
  ],
  guided:
    "In **Bank shift**, predict whether a second river sentence will score higher or lower than a money sentence. Then open **Baseline & threshold** and look for a cut-off that separates every pair: is there one?",
  build: {
    id: "m02-static-vs-contextual",
    title: "Measure context in real vectors",
    packages: ["numpy"],
    data: "minilm",
    parts: [
      part("static-vs-contextual", "p1", "Write cosine similarity and a similarity matrix, and reproduce the table of real `bank` vectors.", [
        "`a @ b / (np.linalg.norm(a) * np.linalg.norm(b))`.",
        "For the matrix, divide each row by its length (`keepdims=True`), then `unit @ unit.T`.",
      ]),
      part("static-vs-contextual", "p2", "Test whether senses separate: each sentence's nearest neighbour, and the average same-sense vs different-sense similarity.", [
        "`max((j for j in range(len(M)) if j != i), key=lambda j: M[i, j])`.",
        "Loop over pairs `i < j` and append `M[i, j]` to `same` or `diff` depending on `senses[i] == senses[j]`.",
      ]),
      part("static-vs-contextual", "p3", "Look inside one sentence: how different are the two `the`s after the model, and which word has `bank` absorbed?", [
        "`repeated_word_similarity` is just `cosine(X[i], X[j])`.",
        "Skip `[CLS]`, `[SEP]` and position `i` itself, then take the candidate with the highest cosine.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-ctx-static",
      prompt: "Why can't a static embedding tell a river bank from a money bank?",
      options: [
        "Its vectors are too short",
        "It gives the word one fixed vector regardless of the sentence, so all senses share one point",
        "It was trained only on financial text",
        "It ignores rare words",
      ],
      correctIndex: 1,
      explanation: "A static vector depends only on the token ID. Context changes vectors only after the transformer's layers mix in the other tokens.",
    },
    {
      id: "m02-ctx-threshold",
      prompt: "Two contextual vectors have a cosine of 0.78. What can you conclude?",
      options: [
        "They are very similar",
        "Not much on its own: compare with the model's baseline for related and unrelated pairs",
        "They are unrelated",
        "They come from the same sentence",
      ],
      correctIndex: 1,
      explanation: "Contextual vectors share a high baseline similarity. In MiniLM, different-sense `bank` pairs average 0.780 and same-sense pairs 0.854, so 0.78 sits right at the different-sense level.",
    },
  ],
  oneSentence:
    "Static vectors give a word one point for all its meanings, while a transformer's layers produce contextual vectors that move with the sentence; in real MiniLM vectors the movement is clear, but sense separation is partial, so read cosine scores against a baseline.",
  deeper: [
    {
      label: "Ethayarajh 2019, how contextual are contextual representations?",
      url: "https://arxiv.org/abs/1909.00512",
      adds: "Measures how much word vectors change with context in BERT, ELMo and GPT-2, layer by layer, and the narrow-cone (anisotropy) effect.",
    },
    {
      label: "Peters et al. 2018, ELMo",
      url: "https://arxiv.org/abs/1802.05365",
      adds: "The paper that showed contextual word vectors beat static ones across many tasks.",
    },
    {
      label: "Jay Alammar: The Illustrated Word2vec",
      url: "https://jalammar.github.io/illustrated-word2vec/",
      adds: "How static word vectors are trained, and the analogies they capture and miss.",
    },
  ],
};
