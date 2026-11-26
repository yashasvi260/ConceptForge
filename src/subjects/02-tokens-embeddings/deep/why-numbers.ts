import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const whyNumbers: DeepLesson = {
  why: [
    "A language model is arithmetic: matrix multiplications over lists of numbers. It cannot read a letter any more than a calculator can. So before a model does anything, a separate program, the **tokenizer**, cuts your text into pieces called **tokens** and replaces each piece with its number in a fixed list, the **vocabulary**. The model only ever sees those numbers. Its answer comes back as numbers too, and the tokenizer turns them back into text.",
    "How you cut the text is a real design decision, not a detail. Cut into whole words and the list of possible pieces never ends: every name, typo, plural and new product needs its own entry, and anything missing is lost. Cut into single characters and the list is short, but every sentence becomes several times longer, and a model's cost grows with length. Every modern LLM uses a compromise between the two, **subwords**: common words stay whole and rare words are spelled from smaller pieces.",
    "This matters to you directly. Prices, context windows and output limits are all counted in tokens, not words. The same sentence can cost three times as many tokens in one language as in another. Odd failures, like a model miscounting the letters in a word, start here. This step compares the three ways of cutting text on real sentences, so the rest of the module (how subword vocabularies are learned and used) has a reason to exist.",
  ],
  worked: [
    {
      kind: "text",
      text: "Take one sentence with the same meaning in four languages (\"The weather is beautiful today, let's go for a walk.\") and cut it four ways: on spaces, into characters, into UTF-8 bytes (how computers store text), and with GPT-4o's real tokenizer.",
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
      text: "Three things stand out. Japanese has no spaces, so \"split on spaces\" sees one giant word: word splitting depends on the writing system. Hindi and Japanese characters each take 2–4 bytes, so byte sequences are much longer than character sequences. And GPT-4o lands in between: 12 tokens for 52 English characters is about 4.3 characters per token.",
    },
    {
      kind: "math",
      text: "English, GPT-4o:  52 characters / 12 tokens = 4.33 characters per token\nHindi,   GPT-4o:  42 characters / 14 tokens = 3.00 characters per token",
    },
    {
      kind: "text",
      text: "Now the vocabulary problem. Build a word vocabulary and a character vocabulary from a tiny training text, `the cat sat on the mat the dog sat on the log`, and try them on a new sentence, `the cats sat on the rug`:",
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
        "A tokenizer does two jobs. **Encoding** turns text into a list of token IDs: cut the text into pieces, then look up each piece's position in the vocabulary. **Decoding** goes back: look up each ID's piece and join them. A good tokenizer is **lossless**: decoding the encoding gives back exactly the original text, spaces and punctuation included, so nothing the user wrote is silently changed.",
        "The vocabulary is just an ordered list. In GPT-4's vocabulary ` the` (with its leading space) is entry 279, so its ID is 279; the number means nothing beyond \"position in this list\". That is why IDs from one model are useless in another: GPT-4o and Llama 3 have different lists, so the same ID points at different pieces. The model's first layer turns each ID into a vector by reading one row of a table (step 11). Everything after that works on vectors, never on text.",
        "Tokenizers are fixed before the model is trained and never change afterwards. The model learns its weights for that exact vocabulary, so swapping the tokenizer means retraining the model.",
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
      mistake: "Thinking the model sees words or letters. It sees only IDs; whether `strawberry` is one ID or three is decided by the tokenizer, and the model has to learn the spelling behind each ID from data.",
    },
    {
      heading: "Words: short sequences, an endless vocabulary",
      paragraphs: [
        "Splitting on spaces gives short sequences (one token per word), and each token carries a lot of meaning. The trouble is the vocabulary. English alone has hundreds of thousands of word forms once you count plurals, tenses, names, numbers and typos, and the list keeps growing. Any word missing from the vocabulary becomes a single **unknown** token (often written `[UNK]`), and its meaning is gone: the model cannot tell `zorbix` from `Kubernetes` if both are unknown.",
        "Word splitting also assumes the language puts spaces between words. Chinese, Japanese and Thai do not, so the \"words\" would be whole sentences, as the Japanese row above shows. And word splitting treats related forms as unrelated: `run`, `runs` and `running` get three separate entries that share nothing, so what the model learns about one does not help the others.",
      ],
    },
    {
      heading: "Characters and bytes: a tiny vocabulary, long sequences",
      paragraphs: [
        "At the other extreme, cut into single characters. The vocabulary is small and nearly every word can be spelled, including words never seen before. The price is length: English text becomes about four times as many tokens as with GPT-4o's tokenizer (52 characters vs 12 tokens above). Length is expensive. A model reads its whole input at every step, and the attention computation inside a transformer grows with the square of the sequence length (Module 03). A 4× longer sequence means roughly 16× more attention work and four times less text fitting into the same context window.",
        "\"Character\" is also less simple than it sounds. Unicode defines well over 100,000 characters, so a character vocabulary that covers every script is large after all, and any character missing from it is unknown again. **Bytes** solve this completely. UTF-8 stores every character as 1 to 4 bytes, and there are only 256 possible byte values. A vocabulary that includes all 256 can represent any text in any language, plus emoji and typos, with nothing ever unknown. The cost is even longer sequences: the Hindi sentence above is 42 characters but 108 bytes.",
      ],
      formula: {
        expr: "bytes per character (UTF-8) = 1 (ASCII) · 2 (é, ñ) · 3 (हि, 日) · 4 (🤖)",
        symbols: [
          { sym: "ASCII", meaning: "basic English letters, digits and punctuation: one byte each" },
          { sym: "UTF-8", meaning: "the standard way to store any Unicode character as 1–4 bytes" },
        ],
        example: "\"é🤖\" is 2 characters but 6 bytes: [195, 169] for é and [240, 159, 164, 150] for the robot.",
      },
    },
    {
      heading: "Subwords: the compromise every LLM uses",
      paragraphs: [
        "Subword tokenizers keep a fixed vocabulary, typically 30,000 to 200,000 pieces, learned from a large training text. Frequent words become a single piece (` the`, ` weather`); rarer words are spelled from a few pieces (GPT-4 splits `unbelievably` into `un` + `belie` + `vably`; GPT-4o into `un` + `bel` + `ievably`); and anything truly new falls back to characters or bytes. You get sequences only a little longer than word splitting, with no unknown tokens, and rare forms share pieces with related words instead of starting from nothing.",
        "How the pieces are chosen is the subject of the next steps: **BPE** (used by GPT models and Llama) merges frequent pairs, **WordPiece** (BERT) is similar with a different scoring rule, and **Unigram** (T5, through SentencePiece) prunes a large vocabulary down. They differ in the details but share the idea: spend vocabulary entries on what is common, and spell what is rare.",
        "A useful number for any tokenizer is its **fertility**: tokens per word, or its inverse, characters per token. Above, GPT-4o covers 4.3 English characters per token but only 3.0 Hindi characters per token. Lower efficiency means a language pays more for the same meaning, which step 9 measures as the \"token tax\".",
      ],
      mistake: "Using a word count to estimate cost or context. Billing and limits use tokens, and the ratio of tokens to words changes with language, topic and tokenizer; count with the real tokenizer of the model you will call.",
    },
  ],
  guided:
    "Predict how many GPT-4o tokens `Unbelievably` takes, then check it in the Overview. Switch to **Three ways**, type a made-up word such as `flurbish`, and explain why the word method marks it unknown while characters and subwords cope.",
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
