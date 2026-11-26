import type { DeepLesson } from "../../../core/types";
import { localListing, part } from "./files";

export const bpeTraining: DeepLesson = {
  why: [
    "Step 1 ended with a promise: a vocabulary that keeps common words whole and spells rare ones from pieces. Someone has to decide which pieces. Writing them by hand is hopeless (which of `ing`, `tion`, `ization` or ` the` deserve an entry?), so the vocabulary is **learned** from a large sample of text. **Byte-Pair Encoding (BPE)** is the learning method used by GPT-2, GPT-3, GPT-4, GPT-4o and Llama, and it is short enough to write yourself.",
    "The idea is the one behind texting shorthand: things you type constantly earn their own symbol. BPE starts with single characters, counts which two neighbouring symbols occur together most often, glues that pair into a new symbol, and repeats. After tens of thousands of rounds, frequent words are single symbols, and frequent fragments (`ing`, `est`, ` un`) are symbols too. The ordered list of glue steps, the **merges**, is the tokenizer.",
    "This step trains BPE on the example from the paper that introduced it to language models (Sennrich, Haddow and Birch, 2016), shows every merge and its count, and explains why \"merge the most frequent pair\" is exactly the right greedy rule if your goal is to make text shorter. Step 4 then uses the learned merges to tokenize words BPE has never seen.",
  ],
  worked: [
    {
      kind: "text",
      text: "The corpus is four words with counts: `low` ×5, `lower` ×2, `newest` ×6, `widest` ×3. Each word starts as characters plus an end-of-word marker `</w>`, so `newest` is `n e w e s t </w>`. That gives 11 distinct starting symbols. Now count every adjacent pair, weighting by word frequency, merge the top one, and repeat ten times:",
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
      text: "Merge 1 is `e + s` with 9: it occurs in `newest` (×6) and `widest` (×3). `s + t` and `t + </w>` also have 9; ties go to the pair seen first. Notice `est</w>` (merge 3): BPE has discovered the suffix *-est* at the end of a word, without knowing any grammar. Here is every word after ten merges:",
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
        "BPE training has four moves. **Start**: split every word of the training text into characters and add an end-of-word marker. **Count**: for every adjacent pair of symbols inside a word, add up how often it appears, weighting each word by how many times it occurs. **Merge**: take the most frequent pair, replace it everywhere with one new symbol, and append the pair to the list of merges. **Repeat** until you have done as many merges as you asked for, or no pairs are left.",
        "Every merge adds exactly one entry to the vocabulary, so the final size is fully predictable: the starting symbols plus the number of merges. That number is the main setting you choose. GPT-2 starts from the 256 possible bytes (step 5), performs 50,000 merges, and adds one special token, `<|endoftext|>`: 256 + 50,000 + 1 = 50,257, exactly its vocabulary size.",
        "The output is two things: the vocabulary, and the ordered list of merges. The order matters, because encoding replays the merges in that order (step 4). That is why GPT-2-style tokenizers ship a `merges.txt` file next to the vocabulary.",
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
    },
    {
      heading: "Why \"most frequent\" is the right rule",
      paragraphs: [
        "BPE began life as a data-compression algorithm (Philip Gage, 1994), and that view explains it best. Merging a pair that occurs n times replaces 2n symbols with n, so the total text gets exactly n symbols shorter. The most frequent pair is therefore the merge that shortens the training text the most. BPE is a greedy compressor: each round, it makes the single change that saves the most length.",
        "The worked example shows the bookkeeping: 95 symbols at the start, minus the ten merge counts (67), leaves 28. Shorter text is what we want from a tokenizer (fewer tokens per request), and greedy compression gets there without any knowledge of language. It finds suffixes, common words and frequent phrases simply because they repeat.",
        "Greedy is not optimal. A merge that looks best now can block a better one later, and BPE never undoes a merge. In practice it is good enough, fast, and fully deterministic: the same text and the same number of merges always give the same tokenizer.",
      ],
      mistake: "Believing BPE learns meaningful word parts. It learns frequent strings. `est</w>` happens to be a real suffix here, but BPE will just as happily create pieces like `ing the` or half a URL if they are common in its training text.",
    },
    {
      heading: "Word boundaries and pre-tokenization",
      paragraphs: [
        "Pairs are only counted **inside** words, never across a space. Otherwise BPE could merge the end of one word with the start of the next into a token that only works in one phrase. The end-of-word marker `</w>` matters too: `est</w>` (an ending) and `est` in the middle of `estimate` become different symbols, so the tokenizer can tell where words end and decoding knows where to put spaces back.",
        "Real tokenizers do more careful splitting before BPE starts, called **pre-tokenization**. GPT-2 uses a regular expression that separates words, numbers, punctuation and whitespace, and keeps a word's leading space attached to it instead of using `</w>`: that is why GPT tokens look like ` the` with a space in front. GPT-4's tokenizer also splits numbers into chunks of at most three digits, which is why `1234567` becomes `123`, `456`, `7` (step 9).",
      ],
    },
    {
      heading: "From toy corpus to real tokenizer",
      paragraphs: [
        "A production tokenizer is trained the same way on gigabytes of text and tens of thousands of merges. The naive loop recounts every pair after every merge, which is far too slow at that scale; real implementations update only the counts of pairs touching the merged symbol. Libraries such as Hugging Face `tokenizers` (written in Rust) do this efficiently, so training a 30,000-entry BPE vocabulary on a large corpus is practical on an ordinary laptop.",
        "How many merges? Early merges are cheap wins: in the worked example the first three each save 9 symbols. Later merges save less and less, because they glue together rarer and rarer pairs; by the tenth merge the saving is down to 3. At real scale the same curve holds, so beyond some point each extra vocabulary entry buys very few saved tokens while still costing a full row in the embedding table (step 2). The usual practice is to pick a round size that fits the model, such as 32,000, 50,000 or 128,000 entries, rather than to search for an optimum.",
        "The \"Run it locally\" listing trains the same corpus with Hugging Face `tokenizers`. Its trainer attaches `</w>` to the last character (so `t</w>` is one starting symbol), which makes its merge list differ from the paper's. And because that toy model has no unknown token, the `y` of `slowly`, never seen in training, silently disappears from the output: exactly the hole that byte-level BPE closes (step 5).",
        "The training text shapes everything. A tokenizer trained mostly on English spends its merges on English; other languages get fewer, shorter pieces, which is the token tax from step 1. A tokenizer trained on code learns pieces for indentation and common keywords. When choosing or training a tokenizer, the corpus is the real design decision; the algorithm is the easy part.",
      ],
    },
  ],
  guided:
    "Predict the first merge before pressing anything (hint: count `e s`, `s t` and `t </w>`). Press **Next merge** ten times and compare with the table, then paste a few sentences of your own and see which pieces BPE invents first.",
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
