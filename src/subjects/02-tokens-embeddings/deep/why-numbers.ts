import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const whyNumbers: DeepLesson = {
  why: [
    "Here's something you might never have thought about. A language model is arithmetic: matrix multiplications over lists of numbers. It can't read a single letter, any more than a calculator can. So how does your text get in?",
    "Before the model does anything, a separate program, the **tokenizer**, cuts your text into pieces called **tokens** and swaps each piece for its number in a fixed list, the **vocabulary**. The model only ever sees those numbers. Its answer comes back as numbers too, and the tokenizer turns them back into text.",
    "Now, how should you cut the text? That's a real design decision, and it's not obvious. Cut into whole words and the list of pieces never ends: every name, typo, plural and new product needs its own entry, and anything missing is lost. Cut into single characters and the list is short, but every sentence becomes several times longer, and a model's cost grows with length. Every modern LLM settles on a compromise in between: **subwords**. Common words stay whole; rare words are spelled from smaller pieces.",
    "And this matters to you directly. Prices, context windows and output limits are all counted in tokens, not words. The same sentence can cost three times as many tokens in one language as in another. Odd failures, like a model miscounting the letters in a word, start right here. In this step you'll compare the three ways of cutting text on real sentences, with real tokenizers.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's measure it. Take one sentence with the same meaning in four languages (\"The weather is beautiful today, let's go for a walk.\") and cut it four ways: on spaces, into characters, into UTF-8 bytes (how computers store text), and with GPT-4o's real tokenizer.",
    },
    {
      kind: "table",
      caption: "The same sentence, cut four ways",
      columns: ["language", "words (split on spaces)", "characters", "UTF-8 bytes", "GPT-4o tokens"],
      rows: [
        ["English", 10, 52, 52, 12],
        ["Spanish", 10, 50, 50, 12],
        ["Hindi", 9, 42, 108, 14],
        ["Japanese", 1, 24, 72, 17],
      ],
      source: "worked/why-numbers.py",
    },
    {
      kind: "text",
      text: "What jumps out at you? Three things stand out. Japanese has no spaces, so \"split on spaces\" sees one giant word: word splitting depends on the writing system. Hindi and Japanese characters each take 2–4 bytes, so byte sequences are much longer than character sequences. And GPT-4o lands in between: 12 tokens for 52 English characters is about 4.3 characters per token.",
    },
    {
      kind: "math",
      text: "English, GPT-4o:  52 characters / 12 tokens = 4.33 characters per token\nHindi,   GPT-4o:  42 characters / 14 tokens = 3.00 characters per token",
    },
    {
      kind: "text",
      text: "Now for the vocabulary problem. Build a word vocabulary and a character vocabulary from a tiny training text, `the cat sat on the mat the dog sat on the log`, and try them on a new sentence, `the cats sat on the rug`:",
    },
    {
      kind: "table",
      caption: "A word vocabulary vs a character vocabulary on new text",
      columns: ["vocabulary", "entries", "tokens in new text", "unknown tokens", "which"],
      rows: [
        ["words", 7, 6, 2, "cats rug"],
        ["characters", 12, 18, 2, "r u"],
      ],
      source: "worked/why-numbers.py",
    },
    {
      kind: "text",
      text: "The word vocabulary fails on `cats`, although it knows `cat`: to a word vocabulary, a plural is a brand-new word. The character vocabulary fails only on two letters it never saw. With a real training set every common letter is covered, but emoji and rare scripts still are not. Bytes fix that for good (step 5). A subword tokenizer would never be stuck on `cats`: if the word is not an entry it is spelled from pieces it has (such as `cat` + `s`), and in a large vocabulary like GPT-4o's, ` cats` is common enough to be one token of its own.",
    },
  ],
  concept: [
    {
      heading: "Text in, numbers out",
      paragraphs: [
        "A tokenizer has two jobs. **Encoding** turns text into a list of token IDs: cut the text into pieces, then look up each piece's position in the vocabulary. **Decoding** goes back the other way: look up each ID's piece and join them together. A good tokenizer is **lossless**: decode what you encoded and you get exactly the original text back, spaces and punctuation included.",
        "So what is an ID, really? Just a position in a list. If ` the` is entry 279 in GPT-4's vocabulary, its ID is 279, and the number means nothing beyond that. That's why IDs from one model are useless in another: GPT-4o and Llama 3 have different lists, so the same ID points at a different piece. Inside the model, each ID picks out one row of a table (step 11), and from then on everything works on vectors, never text.",
        "One more thing that surprises people: tokenizers are fixed before the model is trained, and never change afterwards. The model learns its weights for that exact vocabulary. Swap the tokenizer, and you'd have to retrain the model.",
      ],
      formula: {
        expr: "ids = encode(text)      text = decode(ids)      decode(encode(text)) == text",
        symbols: [
          { sym: "encode", meaning: "cut the text into vocabulary pieces and return their positions (IDs)" },
          { sym: "decode", meaning: "look up each ID's piece and join the pieces back into text" },
          { sym: "ids", meaning: "a list of integers, each between 0 and the vocabulary size − 1" },
        ],
        example: "GPT-2's tokenizer encodes \"The cat sat\" as [464, 3797, 3332]; decoding those three IDs gives back \"The cat sat\".",
      },
      mistake:
        "Thinking the model sees words or letters. It sees only IDs; whether `strawberry` is one ID or three is decided by the tokenizer, and the model has to learn the spelling behind each ID from data.",
      lab: {
        view: "intro",
        label: "Text → IDs",
        task: "Type anything and watch GPT-4o's real tokenizer turn it into pieces and IDs. Find a word that becomes one piece, and one that becomes three.",
      },
    },
    {
      heading: "Words: short sequences, an endless vocabulary",
      paragraphs: [
        "Splitting on spaces is the obvious first idea. You get short sequences (one token per word), and each token carries a lot of meaning. So what's the catch?",
        "The vocabulary. English alone has hundreds of thousands of word forms once you count plurals, tenses, names, numbers and typos, and the list keeps growing. Any word missing from the vocabulary becomes a single **unknown** token (often written `[UNK]`), and its meaning is gone: the model can't tell `zorbix` from `Kubernetes` if both are unknown.",
        "Word splitting also assumes the language puts spaces between words. Chinese, Japanese and Thai don't, so a \"word\" becomes a whole sentence, as the Japanese row shows. And it treats related forms as strangers: `run`, `runs` and `running` get three separate entries that share nothing, so what the model learns about one doesn't help the others.",
      ],
      lab: {
        view: "oov",
        label: "Unknown words",
        task: "Cut the new text into words: which ones does the vocabulary not know? Now switch to characters, then bytes. Which scheme never meets an unknown token?",
      },
    },
    {
      heading: "Characters and bytes: a tiny vocabulary, long sequences",
      paragraphs: [
        "Now go to the other extreme: cut into single characters. The vocabulary is tiny, and almost any word can be spelled, even ones never seen before. Sounds perfect?",
        "The price is length. English becomes about four times as many tokens as with GPT-4o's tokenizer (52 characters vs 12 tokens above). And length is expensive: a model reads its whole input at every step, and attention's work grows with the *square* of the sequence length (Module 03). Four times longer means roughly sixteen times more attention work, and a quarter as much text fitting in the same context window.",
        "\"Character\" is also less simple than it sounds. Unicode defines well over 100,000 characters, so a vocabulary covering every script is large after all, and any character missing from it is unknown again. **Bytes** fix this for good. UTF-8 stores every character as 1 to 4 bytes, and there are only 256 possible byte values. Include all 256 and you can represent any text in any language, emoji and typos included, with nothing ever unknown. The cost? Even longer sequences: the Hindi sentence above is 42 characters but 108 bytes.",
      ],
      formula: {
        expr: "bytes per character (UTF-8) = 1 (ASCII) · 2 (é, ñ) · 3 (हि, 日) · 4 (🤖)",
        symbols: [
          { sym: "ASCII", meaning: "basic English letters, digits and punctuation: one byte each" },
          { sym: "UTF-8", meaning: "the standard way to store any Unicode character as 1–4 bytes" },
        ],
        example: "\"é🤖\" is 2 characters but 6 bytes: [195, 169] for é and [240, 159, 164, 150] for the robot.",
      },
      lab: {
        view: "seq-length",
        label: "Length",
        task: "Compare the same sentence in words, characters, bytes and GPT-4o tokens, for English and then Hindi. Then type your own text: which way of cutting is longest?",
      },
    },
    {
      heading: "Subwords: the compromise every LLM uses",
      paragraphs: [
        "So here's the compromise. Subword tokenizers keep a fixed vocabulary, typically 30,000 to 200,000 pieces, learned from a large training text. Frequent words become a single piece (` the`, ` weather`). Rarer words are spelled from a few pieces (GPT-4 splits `unbelievably` into `un` + `belie` + `vably`; GPT-4o into `un` + `bel` + `ievably`). And anything truly new falls back to characters or bytes. You get sequences only a little longer than word splitting, with no unknown tokens, and rare forms share pieces with related words instead of starting from nothing.",
        "How are the pieces chosen? That's the next few steps. **BPE** (used by GPT models and Llama) merges frequent pairs; **WordPiece** (BERT) is similar with a different scoring rule; **Unigram** (T5, via SentencePiece) prunes a large vocabulary down. They differ in the details, but share one idea: spend vocabulary entries on what's common, and spell what's rare.",
        "A handy number for any tokenizer is its **fertility**: tokens per word, or its flip side, characters per token. GPT-4o covers 4.3 English characters per token, but only 3.0 Hindi characters per token. Lower efficiency means a language pays more for the same meaning: the \"token tax\" that step 9 measures.",
      ],
      mistake:
        "Using a word count to estimate cost or context. Billing and limits use tokens, and the ratio of tokens to words changes with language, topic and tokenizer; count with the real tokenizer of the model you will call.",
      lab: {
        view: "chop",
        label: "Three ways",
        task: "Type a made-up word like `flurbish` and compare words, characters and subwords. Which method copes, and which one gives up?",
      },
    },
  ],
  guided:
    "Before you look, guess how many GPT-4o tokens `Unbelievably` takes. Check in **Text → IDs**. Then open **Unknown words** and find out which way of cutting text never meets an unknown token.",
  build: {
    id: "m02-why-numbers",
    title: "Three ways to cut text, measured",
    packages: [],
    data: "tokens",
    parts: [
      part("why-numbers", "p1", "Write `split_words`, `split_chars` and `split_bytes`, then compare their lengths on four real sentences.", [
        "`str.split()` with no argument splits on any run of whitespace.",
        "`list(text)` gives one item per character; `text.encode(\"utf-8\")` gives bytes, and `list()` of bytes gives ints.",
      ]),
      part("why-numbers", "p2", "Use real GPT-4 and GPT-4o token counts to compute characters per token and the **token tax**: how many times more tokens a language needs than English.", [
        "Each row has `chars`, `cl100k_base` (GPT-4) and `o200k_base` (GPT-4o): `row[encoding]` picks the count.",
        "Build a dict from label to row, then divide `by[label][encoding]` by `by[\"English\"][encoding]`.",
      ]),
      part("why-numbers", "p3", "Measure the **out-of-vocabulary rate** of each scheme: train a vocabulary on one text, then count unknown tokens in another.", [
        "For words and chars, the vocabulary is `set(SCHEMES[scheme](train_text))`; for bytes it is `set(range(256))`.",
        "`sum(1 for t in test if t not in vocab) / len(test)` gives the rate.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-why-cost",
      prompt: "A product description is 300 words in English and 300 words in Hindi. Which is the best way to estimate what each costs to send to a model?",
      options: [
        "Assume about 1.3 tokens per word for both",
        "Count tokens for each text with the tokenizer of the model you'll call",
        "Count characters and divide by 4",
        "Count bytes, since that is how text is stored",
      ],
      correctIndex: 1,
      explanation: "Tokens per word depends on language and tokenizer: with GPT-4 our Hindi sentence needed 3.5× the tokens of the English one, with GPT-4o 1.2×. Rules of thumb are fine for a rough guess; for cost and limits, count with the real tokenizer.",
    },
    {
      id: "m02-why-bytes",
      prompt: "Why can a tokenizer whose base vocabulary is the 256 byte values never produce an unknown token?",
      options: [
        "Because it is trained on every language",
        "Because every possible text is stored as a sequence of bytes, and every byte value is in the vocabulary",
        "Because it replaces unknown words with the closest known word",
        "Because bytes are shorter than characters",
      ],
      correctIndex: 1,
      explanation: "UTF-8 turns any text, including emoji and rare scripts, into bytes from 0 to 255. With all 256 in the vocabulary, the worst case is spelling something byte by byte: more tokens, but never unknown.",
    },
    {
      id: "m02-why-cats",
      prompt: "A word-level vocabulary built from training text contains `cat` but not `cats`. What happens to `cats` in new text, and what does a subword tokenizer do instead?",
      options: [
        "It becomes unknown; a subword tokenizer can still spell it from pieces it knows",
        "It is mapped to `cat` automatically; subwords do the same",
        "It is split into characters by the word tokenizer",
        "It is dropped from the text by both",
      ],
      correctIndex: 0,
      explanation: "A word vocabulary has no notion of related forms, so `cats` is simply missing. A subword tokenizer always has a fallback: frequent forms get their own entry (` cats` is one token in GPT-4o), and anything else is spelled from smaller pieces, down to bytes.",
    },
  ],
  oneSentence:
    "A tokenizer turns text into IDs from a fixed vocabulary; words give short sequences but endless unknowns, characters and bytes give no unknowns but long sequences, and subwords, used by every modern LLM, keep common words whole and spell rare ones from pieces.",
  deeper: [
    {
      label: "Hugging Face LLM course: tokenizers",
      url: "https://huggingface.co/learn/llm-course/chapter2/4",
      adds: "Word, character and subword tokenization side by side, with the encode and decode API you will use in practice.",
    },
    {
      label: "Sennrich, Haddow & Birch 2016, subword units",
      url: "https://arxiv.org/abs/1508.07909",
      adds: "The paper that brought subwords (BPE) to neural translation, and why rare words were the problem.",
    },
    {
      label: "OpenAI tiktoken",
      url: "https://github.com/openai/tiktoken",
      adds: "The open-source tokenizer behind GPT-4 and GPT-4o, used for this step's real counts.",
    },
  ],
};
