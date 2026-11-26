import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const bigPicture: DeepLesson = {
  why: [
    "Let's start with a question. How would you get a computer to write? Not fill in a form, not pick from canned replies, but actually continue any text you give it: finish your email, answer your question, write your code.",
    "For decades people tried rules. Grammar rules, templates, long lists of facts. It never lasted. Language keeps doing things the rule-writer didn't expect, and every new surprise needed another rule.",
    "The idea that finally worked is almost too simple to believe: **just guess the next piece of text**. Show a program an enormous amount of real writing and keep asking it one question: \"given everything so far, what comes next?\" When it guesses wrong, nudge it a little. Nobody writes a single rule. Spelling, grammar, facts, style, even steps of reasoning get picked up, because each of them helps the guess.",
    "And once a program guesses well, writing is just a loop: guess a piece, add it to the end, guess again. That loop is exactly what ChatGPT, Claude or a code assistant runs while it answers you. In this step you'll watch a real model, gemma4, run that loop, and then build the simplest version yourself, a word counter, so you can see every number.",
  ],
  worked: [
    {
      kind: "text",
      text: "Here's the smallest language model there is. Its whole training text is 20 tokens (counting each `.` as a word): `the cat sat on the mat . the cat ate the fish . the dog sat on the rug .` It only does one thing: count which word comes right after each word. This is called a **bigram model**. So what has it seen after `the`?",
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
      text: "That list is the model's whole \"knowledge\" about `the`. Now let it write. Start with `the`, and every time, take the most likely next word (on a tie, the one it saw first). This rule is called **greedy decoding**. Before you look at the table: where do you think it ends up?",
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
      text: "It wrote `the cat sat on the cat sat on` and got stuck going round in a circle. Keep both halves of that in mind. The loop itself *works*: this is genuinely how every LLM writes. But a model that only remembers one word, and always takes the top choice, is far too weak. The rest of the course fixes exactly those two weaknesses.",
    },
  ],
  concept: [
    {
      heading: "Next-token prediction",
      paragraphs: [
        "So what is a language model, exactly? It's a function. You give it the text so far, and it gives you back a **probability for every possible next piece**. Notice: not one answer. A whole list of scores that add up to 1, like `cat 0.333, mat 0.167, …` from our counter.",
        "That list is the heart of everything. Writing, chatting, answering questions, translating: they're all built on top of it. When gemma4 sees `Once upon a time, there was a`, it doesn't \"decide\" on `small`. It gives `small` 93.9%, `tiny` 2.6%, and a little bit to thousands of other tokens.",
        "Why \"pieces\" and not words? Real models cut text into **tokens**, which are often parts of words: `unbelievable` might become `un`, `believ`, `able`. The full set of tokens a model knows is its **vocabulary**, about 50,000 for GPT-2 and about 128,000 for Llama 3. Module 02 shows how those pieces are chosen.",
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
      lab: {
        view: "guess-next",
        label: "Guess the next token",
        task: "Pick a prompt and guess what gemma4 will say next. Then look at the full list: how much did it give your guess?",
      },
    },
    {
      heading: "The generation loop",
      paragraphs: [
        "One prediction gives you one token. How do you get a whole answer? You loop. (1) Feed the text in. (2) Get the probability list. (3) Choose one token. (4) Stick it on the end. (5) Go again. Each new token is predicted from the model's own earlier output, which is why this is called **autoregressive** generation.",
        "When does it stop? Either the model produces a special **end-of-text** token (\"I'm done\"), or you hit a length limit you set. And here's the part people often miss: every trip round the loop is a full run through the whole model, a **forward pass**. A 500-token answer means 500 forward passes. That's why long answers take longer and cost more, and why Part IV has a whole module on making this loop fast.",
        "Now the surprising bit. The loop never plans the sentence. It commits to one token at a time and can only build on what's already there. So how do good models still write coherent paragraphs? Because the probability list at every step already \"knows\" where the text is likely heading.",
      ],
      lab: {
        view: "loop-lab",
        label: "Generation loop",
        task: "Step through one token with **Next micro-step** and count the forward passes. Then press **Full token** until gemma4 finishes. Could you take a token back once it's added?",
      },
    },
    {
      heading: "Choosing the next token",
      paragraphs: [
        "Step (3), choosing, is where a lot of a model's personality comes from. The simplest choice is **greedy decoding**: always take the top token. It's predictable and repeatable. But you saw what it did to our counter: it got stuck in a circle. And it never surprises you.",
        "The other option is **sampling**: pick at random, but weighted by the probabilities. If `village` has 72.5%, it's chosen about 72 times in 100, and `cottage` (5.7%) about 6 times. Same model, different stories each time.",
        "A setting called **temperature** controls how adventurous sampling is. Below 1, it sharpens the list, so the favourite wins even more often. Above 1, it flattens the list, so unlikely tokens get a real chance. At 0 it's just greedy. Here's a question worth thinking about before you try the lab: if a model gives `Paris` 100%, does temperature change anything at all?",
      ],
      lab: {
        view: "temperature",
        label: "Temperature",
        task: "Move the temperature from 0 to 2 and watch the bars. Then press **Sample 20 times** at 0.5 and at 1.5. Which gives you more variety, and why?",
      },
    },
    {
      heading: "From counting to neural networks",
      paragraphs: [
        "Our counter has two big problems. Let's look at each one.",
        "Problem one: it only remembers **one** word. After `the`, it has no idea whether we were talking about cats or rugs. Real models read the whole context: up to 1,024 tokens for GPT-2, 8,192 for Llama 3, and far more for newer models.",
        "Problem two: it can only repeat pairs it has literally seen. If `dog ate` never appeared in training, the counter gives it probability 0. Not small. Zero. Forever. And counting longer word sequences makes this worse, not better, because almost every 10-word sentence you write has never been written before.",
        "Neural language models fix both. Instead of a table of counts, they turn each token into a list of numbers (a **vector**), arranged so that similar words get similar numbers. Then layer after layer mixes in information from the whole context. Because `dog` and `cat` end up with similar vectors, what the model learned about cats partly carries over to dogs. It **generalises** instead of looking things up. The next step opens up those layers.",
      ],
      mistake:
        "Thinking an LLM looks answers up in a stored copy of its training text. It doesn't keep the text at all. It keeps learned numbers (weights) that produce a probability list for the next token. It can repeat famous passages because it saw them many times, but mostly it produces new combinations, which is also why it can sound confident while being wrong.",
      lab: {
        view: "bigram",
        label: "Counting model",
        task: "Check the probability of `dog` after `the`, then of `zebra`. Now add a sentence to the training text that contains `the zebra` and check again. What does this tell you about counting?",
      },
    },
    {
      heading: "Why one simple task goes so far",
      paragraphs: [
        "Here's the puzzle: how can \"guess the next token\" possibly give you translation, summaries and working code? The answer is that guessing **well** is hard, and it gets harder in interesting ways.",
        "To continue `The capital of France is`, you need a fact. To continue a half-written Python function, you need to follow the logic of the code. To continue a story, you need to keep track of who's who. A model that keeps getting better at the guess is forced to pick up all of these along the way.",
        "That's why one pretrained model can be used in so many ways (Part II of this course), and why turning it into a helpful assistant is a smaller, later training stage (Part III). It all starts with the loop you just watched.",
      ],
      lab: {
        view: "next-token-tasks",
        label: "What it takes",
        task: "For each prompt, predict gemma4's answer and how sure it will be before you reveal it. Which prompt is it least sure about, and why?",
      },
    },
  ],
  guided:
    "Open the **Generation loop** lab and pick \"Once upon a time, there was a\". Predict gemma4's first word before pressing anything. Then run the loop at temperature 0, reset, and run it again at 1.5. What changed, and what didn't?",
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
