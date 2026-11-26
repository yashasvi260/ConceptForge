import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const bigPicture: DeepLesson = {
  why: [
    "Suppose you want a computer to write. Not to fill in a form or pick from a list of canned replies, but to continue any text you give it: finish an email, answer a question, translate a sentence, write code. For decades people tried to do this with hand-written rules (grammar rules, templates, lists of facts). Rules break the moment language does something the rule-writer didn't expect, and language does that all the time.",
    "The idea that won is almost embarrassingly simple: **learn to guess the next piece of text**. Show a program a huge amount of real writing and ask it, over and over, \"given everything so far, what comes next?\" Every time it guesses wrong, adjust it a little. Nobody writes rules; the patterns of language (spelling, grammar, facts, styles, even steps of reasoning) are absorbed because they help with the guess.",
    "Once a program guesses the next piece well, writing is just a loop: guess a piece, stick it on the end, guess again. That loop is what every chatbot and code assistant runs when it answers you. A **language model** is the guessing part; a **large language model** (LLM) is one with billions of learned numbers inside, trained on trillions of words.",
    "This step builds the loop with the simplest possible guesser, one that only counts which word follows which, so you can see every number. Every later module replaces a piece of this toy with the real thing.",
  ],
  worked: [
    {
      kind: "text",
      text: "Our whole training text is 20 tokens (counting each `.` as a word): `the cat sat on the mat . the cat ate the fish . the dog sat on the rug .` The simplest language model, a **bigram model**, counts which word comes right after each word. Here is everything that ever followed `the`:",
    },
    {
      kind: "table",
      caption: "What follows “the” in the training text",
      columns: ["next word", "times seen", "fraction", "probability"],
      rows: [
        ["cat", 2, "2/6", 0.333],
        ["mat", 1, "1/6", 0.167],
        ["fish", 1, "1/6", 0.167],
        ["dog", 1, "1/6", 0.167],
        ["rug", 1, "1/6", 0.167],
      ],
      source: "worked/big-picture.py",
    },
    {
      kind: "math",
      text: "P(cat | the) = count(the → cat) / count(the → anything)\n             = 2 / 6\n             = 0.333",
    },
    {
      kind: "text",
      text: "Now generate. Start with `the`, and each time append the most likely next word (if two are tied, take the one seen first in the text). This rule is called **greedy decoding**:",
    },
    {
      kind: "table",
      caption: "Greedy generation, one token at a time",
      columns: ["current word", "what followed it in training", "picked"],
      rows: [
        ["the", "cat 2, mat 1, fish 1, dog 1, rug 1", "cat"],
        ["cat", "sat 1, ate 1", "sat"],
        ["sat", "on 2", "on"],
        ["on", "the 2", "the"],
        ["the", "cat 2, mat 1, fish 1, dog 1, rug 1", "cat"],
        ["cat", "sat 1, ate 1", "sat"],
        ["sat", "on 2", "on"],
      ],
      source: "worked/big-picture.py",
    },
    {
      kind: "text",
      text: "The output is `the cat sat on the cat sat on`. Grammatical-ish, and stuck in a loop. Both facts matter: the loop *works* (this is how every LLM writes), and a model that only sees one previous word, and always takes the top choice, is far too weak. The rest of the course fixes exactly those two weaknesses.",
    },
  ],
  concept: [
    {
      heading: "Next-token prediction",
      paragraphs: [
        "A language model is a function that takes the text so far and returns a **probability for every possible next piece**. Not one answer: a full list of scores that add up to 1, such as `cat 0.333, mat 0.167, …`. Everything else (writing, chatting, answering) is built on top of that list.",
        "The pieces are called **tokens**. In our toy a token is a whole word; real models split text into sub-word chunks, so `unbelievable` might become `un`, `believ`, `able`. The set of all tokens the model knows is its **vocabulary**: about 50,000 for GPT-2, about 128,000 for Llama 3. Module 02 shows how that split is chosen.",
      ],
      formula: {
        expr: "P(xₜ | x₁, x₂, …, xₜ₋₁)",
        symbols: [
          { sym: "xₜ", meaning: "the token at position t, the one we are guessing" },
          { sym: "x₁ … xₜ₋₁", meaning: "every token before it (the context)" },
          { sym: "P( · | · )", meaning: "probability of the left side given the right side" },
        ],
        example: "In the toy, the context is cut down to just the previous word, so P(cat | …, the) becomes P(cat | the) = 2/6 = 0.333.",
      },
    },
    {
      heading: "The generation loop",
      paragraphs: [
        "Generating text is a loop around next-token prediction. (1) Feed the context to the model. (2) Get the probability list. (3) Choose one token from it. (4) Append that token to the context. (5) Repeat. This is called **autoregressive** generation: each new token is predicted from the model's own earlier output.",
        "The loop stops when the model produces a special **end-of-text** token, or when a maximum length is reached. Each trip round the loop is one full pass through the model (a **forward pass**), so a 500-token answer means 500 passes. That is why long answers take longer and cost more, and why Part IV spends a whole module on making this loop fast.",
        "Notice what the loop does *not* do: it never plans the whole sentence first. The model commits to one token at a time and can only build on what is already written. Good models still produce coherent paragraphs because the probability list at every step already reflects where the text is likely to go.",
      ],
    },
    {
      heading: "Choosing the next token",
      paragraphs: [
        "Step (3) of the loop is a choice, and the choice matters. **Greedy decoding** always takes the highest-probability token. It is simple and repeatable, but as the worked example shows, it can get stuck repeating itself, and it never surprises you.",
        "The alternative is **sampling**: pick a token at random, weighted by the probabilities, so `cat` is chosen a third of the time and `mat`, `fish`, `dog` and `rug` the rest. A setting called **temperature** sharpens or flattens the list before sampling: low temperature behaves almost like greedy, high temperature makes rare tokens more likely. Module 06 lets you play with temperature, top-k and top-p on a real model.",
      ],
    },
    {
      heading: "From counting to neural networks",
      paragraphs: [
        "Our bigram counter has two fatal limits. First, it only sees **one** previous word. After `the` it cannot tell whether we were talking about cats or rugs. Real models look at the whole context: up to 1,024 tokens for GPT-2, 8,192 for Llama 3, far more for newer models.",
        "Second, it can only repeat pairs it has literally seen. If `the cat ate` never appeared, the probability of `ate` after `cat` would be exactly 0 forever. Counting longer word sequences makes this worse, not better: almost every 10-word sequence you write has never appeared anywhere before.",
        "A neural language model fixes both. Instead of a table of counts, it turns each token into a list of numbers (a **vector**) where similar words get similar numbers, then runs those vectors through layers that combine information from the whole context. Because `dog` and `cat` end up with similar vectors, what the model learned about cats partly transfers to dogs. It **generalises** instead of looking things up. The next step opens up those layers.",
      ],
      mistake:
        "Thinking an LLM looks answers up in a stored copy of its training text. It doesn't store the text at all. It stores learned numbers (weights) that produce a probability list for the next token. It can repeat famous passages because they were seen many times, but mostly it produces new combinations, which is also why it can confidently produce things that are false.",
    },
    {
      heading: "Why one simple task goes so far",
      paragraphs: [
        "It is surprising that guessing the next token is enough to get translation, summaries and working code. The reason is that guessing well is *hard*. To continue `The capital of France is` you need a fact. To continue a half-written Python function you need to follow the code's logic. To continue a story you need to keep track of characters. A model that gets better at the guess is forced to pick up all of these.",
        "That is why the same pretrained model can be used in so many ways (Part II of this course) and why the jump from base model to helpful assistant is a later, smaller training stage (Part III). Everything starts with the loop you just built.",
      ],
    },
  ],
  guided:
    "In the **Generation loop lab**, pick \"Once upon a time, there was a\" and predict gemma4's first word before pressing anything. Step through one token with **Next micro-step**, watching which stage costs a forward pass. Then set temperature to 0 and press **Full token** until the reply ends, reset, raise temperature to 1.5 and run it again: what changed, and what didn't? Finally try \"The capital of France is\" and explain why temperature makes no difference there.",
  build: {
    id: "01-big-picture-bigram",
    title: "Build the loop: a bigram language model",
    packages: [],
    parts: [
      part("big-picture", "p1", "Write `count_bigrams(tokens)`: for every neighbouring pair of tokens, count how often the second followed the first.", [
        "`zip(tokens, tokens[1:])` pairs each token with the one after it.",
        "Use `counts.setdefault(prev, {})` to create the inner dict, then `counts[prev][nxt] = counts[prev].get(nxt, 0) + 1`.",
      ]),
      part("big-picture", "p2", "Write `next_token_probs(counts, prev)`: turn the counts after `prev` into probabilities. This is the model's output.", [
        "The total is `sum(followers.values())`.",
        "Return `{tok: c / total for tok, c in followers.items()}`.",
      ]),
      part("big-picture", "p3", "Write `generate(counts, start, n)`: the generation loop with greedy decoding. Your output should get stuck, just like the worked example.", [
        "`max(followers, key=followers.get)` returns the most frequent follower.",
        "Append it to `out`; the next round looks at `out[-1]`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "bp-zero",
      prompt: "In the toy model, what probability does `ate` get after `dog`, and why is that a problem?",
      options: [
        "0, because `dog ate` never appears in the training text, so the model can never produce it",
        "1/6, because `ate` appears once",
        "0.5, because `dog` has two followers",
        "It depends on the temperature",
      ],
      correctIndex: 0,
      explanation:
        "A counting model gives exactly 0 to any pair it never saw. Real text is full of new combinations, which is why neural models, which generalise through similar vectors, replaced counting.",
    },
    {
      id: "bp-cost",
      prompt: "A model writes a 300-token answer. Roughly how many forward passes through the model did that take?",
      options: ["1, because the whole answer is planned at once", "About 300, one per generated token", "About 3, one per sentence", "It depends on the vocabulary size"],
      correctIndex: 1,
      explanation: "Autoregressive generation runs the model once per new token, so cost and waiting time grow with the length of the answer.",
    },
    {
      id: "bp-greedy",
      prompt: "Why did the greedy toy output loop (`the cat sat on the cat sat on`)?",
      options: [
        "Because sampling picked the same word by chance",
        "Because it sees only one previous word and always takes the top choice, so the same word always leads to the same next word",
        "Because the vocabulary is too large",
        "Because the training text was in the wrong order",
      ],
      correctIndex: 1,
      explanation: "With one word of context and a deterministic choice, reaching `the` again replays the same path. More context and sampling both break the cycle.",
    },
  ],
  oneSentence:
    "A language model gives a probability to every possible next token, and generation is a loop that picks one, appends it and asks again.",
  deeper: [
    { label: "Radford et al. 2019, GPT-2 paper", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf", adds: "Section 2 frames language modelling as P(next token | previous tokens) and shows one model doing many tasks." },
    { label: "Jurafsky & Martin, Speech and Language Processing, ch. 3", url: "https://web.stanford.edu/~jurafsky/slp3/3.pdf", adds: "The classic, free chapter on n-gram (counting) language models and why they run out of data." },
  ],
};
