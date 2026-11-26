import type { DeepLesson } from "../../../core/types";
import { localListing, part } from "./files";

export const bpeTraining: DeepLesson = {
  why: [
    "Step 1 ended with a promise: a vocabulary that keeps common words whole and spells rare ones from pieces. But someone has to decide *which* pieces. Could you write them by hand? Which deserve an entry: `ing`, `tion`, `ization`, ` the`? Hopeless. So the vocabulary is **learned** from a large sample of text instead.",
    "The learning method behind GPT-2, GPT-3, GPT-4, GPT-4o and Llama is **Byte-Pair Encoding (BPE)**, and it's short enough to write yourself. The idea is the same one behind texting shorthand: things you type constantly earn their own symbol. BPE starts with single characters, counts which two neighbouring symbols appear together most often, glues that pair into a new symbol, and repeats.",
    "After tens of thousands of rounds, frequent words are single symbols, and frequent fragments (`ing`, `est`, ` un`) are symbols too. The ordered list of glue steps, the **merges**, *is* the tokenizer. In this step you'll train BPE on the example from the paper that brought it to language models (Sennrich, Haddow and Birch, 2016), watch every merge and its count, and see why \"merge the most frequent pair\" is exactly the right greedy rule if your goal is to make text shorter.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's train it by hand. The corpus is four words with counts: `low` ×5, `lower` ×2, `newest` ×6, `widest` ×3. Each word starts as characters plus an end-of-word marker `</w>`, so `newest` is `n e w e s t </w>`. That gives 11 distinct starting symbols. Now count every adjacent pair, weighting by word frequency, merge the top one, and repeat ten times:",
    },
    {
      kind: "table",
      caption: "The first ten merges on the Sennrich corpus",
      columns: ["merge #", "pair", "new symbol", "pair count", "vocabulary size"],
      rows: [
        [1, "e + s", "es", 9, 12],
        [2, "es + t", "est", 9, 13],
        [3, "est + </w>", "est</w>", 9, 14],
        [4, "l + o", "lo", 7, 15],
        [5, "lo + w", "low", 7, 16],
        [6, "n + e", "ne", 6, 17],
        [7, "ne + w", "new", 6, 18],
        [8, "new + est</w>", "newest</w>", 6, 19],
        [9, "low + </w>", "low</w>", 5, 20],
        [10, "w + i", "wi", 3, 21],
      ],
      source: "worked/bpe-training.py",
    },
    {
      kind: "text",
      text: "Did you predict the first merge? Merge 1 is `e + s` with 9: it occurs in `newest` (×6) and `widest` (×3). `s + t` and `t + </w>` also have 9; ties go to the pair seen first. Notice `est</w>` (merge 3): BPE has discovered the suffix *-est* at the end of a word, without knowing any grammar. Here is every word after ten merges:",
    },
    {
      kind: "table",
      caption: "Every word after ten merges",
      columns: ["word", "count", "symbols"],
      rows: [
        ["low", 5, "low</w>"],
        ["lower", 2, "low e r </w>"],
        ["newest", 6, "newest</w>"],
        ["widest", 3, "wi d est</w>"],
      ],
      source: "worked/bpe-training.py",
    },
    {
      kind: "math",
      text: "symbols before:  low 4×5 + lower 6×2 + newest 7×6 + widest 7×3 = 20 + 12 + 42 + 21 = 95\neach merge removes (its count) symbols:  9+9+9+7+7+6+6+6+5+3 = 67\nsymbols after:   95 − 67 = 28   (= 1×5 + 4×2 + 1×6 + 3×3)",
    },
  ],
  concept: [
    {
      heading: "The training loop",
      paragraphs: [
        "BPE training has just four moves. **Start**: split every word of the training text into characters and add an end-of-word marker. **Count**: for every pair of neighbouring symbols inside a word, add up how often it appears, weighting each word by how many times it occurs. **Merge**: take the most frequent pair, replace it everywhere with one new symbol, and add it to the list of merges. **Repeat** until you've done as many merges as you asked for, or there are no pairs left.",
        "Here's a neat consequence: every merge adds exactly one entry to the vocabulary, so the final size is fully predictable. Starting symbols plus the number of merges. That number is the main setting you choose. GPT-2 starts from the 256 possible bytes (step 5), does 50,000 merges, and adds one special token, `<|endoftext|>`: 256 + 50,000 + 1 = 50,257, exactly its vocabulary size.",
        "What comes out is two things: the vocabulary, and the *ordered* list of merges. The order matters, because encoding replays the merges in that order (step 4). That's why GPT-2-style tokenizers ship a `merges.txt` file next to the vocabulary.",
      ],
      formula: {
        expr: "best = argmax over pairs (a, b) of Σ_words freq(word) × occurrences of (a, b) in word\nV_final = V_start + number_of_merges",
        symbols: [
          { sym: "freq(word)", meaning: "how many times the word appears in the training text" },
          { sym: "argmax", meaning: "the pair with the highest total count (ties: the pair seen first)" },
          { sym: "V_start", meaning: "the starting symbols: characters (here 11) or the 256 bytes" },
        ],
        example: "Merge 1: count(e, s) = 6 (newest) + 3 (widest) = 9, the highest, so `es` becomes symbol 12.",
      },
      lab: {
        view: "bpe-train",
        label: "Train BPE",
        task: "Before pressing anything, predict the first merge (count `e s`, `s t` and `t </w>`). Then press **Next merge** ten times and compare with the table. Finally paste your own sentences: which pieces does BPE invent first?",
      },
    },
    {
      heading: "Why \"most frequent\" is the right rule",
      paragraphs: [
        "Why should the most frequent pair go first? BPE actually began life as a data-compression algorithm (Philip Gage, 1994), and that view explains it best. Merging a pair that occurs n times replaces 2n symbols with n, so the text gets exactly n symbols shorter. So the most frequent pair is the merge that shortens the text the most. BPE is a greedy compressor: each round, it makes the single change that saves the most length.",
        "The worked example shows the bookkeeping: 95 symbols at the start, minus the ten merge counts (67), leaves 28. And shorter text is exactly what we want from a tokenizer (fewer tokens per request). Greedy compression gets there without any knowledge of language. It finds suffixes, common words and frequent phrases simply because they repeat.",
        "Is greedy perfect? No. A merge that looks best now can block a better one later, and BPE never undoes a merge. In practice it's good enough, fast, and fully deterministic: the same text and the same number of merges always give the same tokenizer.",
      ],
      mistake:
        "Believing BPE learns meaningful word parts. It learns frequent strings. `est</w>` happens to be a real suffix here, but BPE will just as happily create pieces like `ing the` or half a URL if they are common in its training text.",
      lab: {
        view: "bpe-compress",
        label: "Compression",
        task: "Slide through the ten merges and watch the corpus shrink. How many symbols does each merge save, and why is that number the same as the pair's count?",
      },
    },
    {
      heading: "Word boundaries and pre-tokenization",
      paragraphs: [
        "Notice that pairs are only counted **inside** words, never across a space. Why? Otherwise BPE could merge the end of one word with the start of the next, making a token that only works in one phrase. The end-of-word marker `</w>` matters too: `est</w>` (an ending) and `est` in the middle of `estimate` become different symbols, so the tokenizer can tell where words end, and decoding knows where to put spaces back.",
        "Real tokenizers do more careful splitting before BPE even starts, called **pre-tokenization**. GPT-2 uses a regular expression that separates words, numbers, punctuation and whitespace, and keeps a word's leading space attached to it instead of using `</w>`. That's why GPT tokens look like ` the`, with a space in front. GPT-4's tokenizer also splits numbers into chunks of at most three digits, which is why `1234567` becomes `123`, `456`, `7` (step 9).",
      ],
      lab: {
        view: "pretokenize",
        label: "Pre-tokenizer",
        task: "Type a sentence with a contraction, a long number and some punctuation. Which chunks do you get? Could BPE ever merge a word with the comma after it?",
      },
    },
    {
      heading: "From toy corpus to real tokenizer",
      paragraphs: [
        "A production tokenizer is trained exactly the same way, just on gigabytes of text and tens of thousands of merges. The naive loop recounts every pair after every merge, which is far too slow at that scale, so real implementations update only the counts of pairs touching the merged symbol. Libraries like Hugging Face `tokenizers` (written in Rust) do this efficiently, so training a 30,000-entry BPE vocabulary on a large corpus is practical on an ordinary laptop.",
        "How many merges should you do? Early merges are cheap wins: in the worked example, the first three each save 9 symbols. Later merges save less and less, because they glue together rarer and rarer pairs; by the tenth, the saving is down to 3. At real scale the same curve holds, so beyond some point each extra vocabulary entry buys very few saved tokens, while still costing a full row in the embedding table (step 2). In practice people pick a round size that fits the model, like 32,000, 50,000 or 128,000 entries, rather than searching for an optimum.",
        "The \"Run it locally\" listing trains the same corpus with Hugging Face `tokenizers`. Its trainer attaches `</w>` to the last character (so `t</w>` is one starting symbol), which makes its merge list differ from the paper's. And because that toy model has no unknown token, the `y` of `slowly`, never seen in training, silently disappears from the output: exactly the hole that byte-level BPE closes (step 5).",
        "And remember: the training text shapes everything. A tokenizer trained mostly on English spends its merges on English, so other languages get fewer, shorter pieces: the token tax from step 1. A tokenizer trained on code learns pieces for indentation and common keywords. When you choose or train a tokenizer, the corpus is the real design decision; the algorithm is the easy part.",
      ],
      lab: {
        view: "merges-curve",
        label: "Diminishing returns",
        task: "Learn 25 merges on the paragraph and compare what merge 1 and the last merge save. Paste a paragraph from your own work: which pieces get merged first?",
      },
    },
  ],
  guided:
    "Predict the first merge before pressing anything in **Train BPE**. Then open **Compression** and work out how many symbols are left after ten merges, before you move the slider.",
  build: {
    id: "m02-bpe-training",
    title: "Train BPE from scratch",
    packages: [],
    data: "bpe",
    parts: [
      part("bpe-training", "p1", "Count adjacent symbol pairs inside each word, weighted by word frequency.", [
        "`zip(symbols, symbols[1:])` gives each adjacent pair once.",
        "Add the word's frequency, not 1: `pairs[(a, b)] += freq`.",
      ]),
      part("bpe-training", "p2", "Merge one pair everywhere it occurs, left to right, producing new symbol tuples.", [
        "Use an index `i` and a `while` loop so you can skip two symbols after a merge.",
        "Check `i + 1 < len(symbols)` before looking at `symbols[i + 1]`.",
      ]),
      part("bpe-training", "p3", "Put it together: the BPE training loop. Your ten merges must match the paper's.", [
        "`best = max(pairs, key=pairs.get)` picks the most frequent pair; on ties, the first one counted wins.",
        "After recording `best`, replace `words` with `merge_pair(best, words)` before the next round.",
      ]),
    ],
  },
  local: [localListing("train-bpe", "Train BPE with Hugging Face tokenizers", ["tokenizers"])],
  checks: [
    {
      id: "m02-bpe-vocab-size",
      prompt: "A BPE tokenizer starts from the 256 byte values, learns 31,000 merges and adds 3 special tokens. How large is its vocabulary?",
      options: ["31,000", "31,256", "31,259", "It depends on the training text"],
      correctIndex: 2,
      explanation: "Each merge adds exactly one entry: 256 + 31,000 + 3 = 31,259. The training text decides which entries, not how many.",
    },
    {
      id: "m02-bpe-why-frequent",
      prompt: "Why does BPE merge the most frequent pair first?",
      options: [
        "Frequent pairs are more likely to be real words",
        "Merging a pair that occurs n times shortens the training text by n symbols, so the most frequent pair shortens it the most",
        "It is required to keep the vocabulary sorted",
        "Rare pairs cannot be merged",
      ],
      correctIndex: 1,
      explanation: "BPE is a greedy compressor: each merge replaces 2n symbols with n. In the worked example the ten merges remove 9+9+9+7+7+6+6+6+5+3 = 67 symbols, taking the corpus from 95 to 28.",
    },
    {
      id: "m02-bpe-boundaries",
      prompt: "Why are pairs never counted across the space between two words?",
      options: [
        "Spaces cannot be stored in a vocabulary",
        "So tokens do not glue the end of one word to the start of the next, which would only fit that one phrase",
        "Because it would make training slower",
        "Because BPE only works on single words",
      ],
      correctIndex: 1,
      explanation: "Cross-word merges would create pieces tied to specific word pairs. Keeping merges inside words (and marking word ends) makes pieces reusable and lets decoding restore the spaces.",
    },
  ],
  oneSentence:
    "BPE learns a vocabulary by repeatedly merging the most frequent adjacent pair of symbols inside words, which is the greedy way to make the training text as short as possible, and the ordered list of merges is the tokenizer.",
  deeper: [
    {
      label: "Sennrich, Haddow & Birch 2016",
      url: "https://arxiv.org/abs/1508.07909",
      adds: "The paper's Algorithm 1 is the loop you just wrote, with this exact low/lower/newest/widest example.",
    },
    {
      label: "Hugging Face LLM course: BPE tokenization",
      url: "https://huggingface.co/learn/llm-course/chapter6/5",
      adds: "BPE training and encoding step by step on a different corpus, plus how GPT-2's byte-level version differs.",
    },
    {
      label: "GPT-2's encoder.py",
      url: "https://github.com/openai/gpt-2/blob/master/src/encoder.py",
      adds: "OpenAI's original BPE encoder: the pre-tokenization regex and the merge loop, in about 100 lines.",
    },
  ],
};
