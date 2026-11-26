import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const bytesLesson: DeepLesson = {
  why: [
    "Character-level BPE has one hole left. Can you spot it? Its base vocabulary is the set of characters seen in training. So a character that never appeared (an emoji, a rare script, a maths symbol) has no symbol at all, and becomes unknown. And Unicode defines over 150,000 characters; putting them all in the base vocabulary would spend most of the budget on characters almost nobody types.",
    "GPT-2 closed the hole with one simple change: build BPE on **bytes** instead of characters. Computers already store every character as one to four bytes (UTF-8), and a byte can only take 256 values. Start the vocabulary with those 256, and every possible text, in every language, with every emoji and typo, can be represented. Merges then glue frequent byte sequences into longer pieces, exactly as before. Every GPT tokenizer since, and Llama 3's, works this way.",
    "But bytes bring their own surprises, and you'll meet them in practice. Vocabulary files are full of strange symbols like `Ġ`. Some tokens hold only *part* of a character, so decoding one token at a time can print `�`, and a streaming chat interface has to hold back half-finished characters. In this step you'll see how UTF-8 works, why the strange symbols exist, and how to decode a token stream safely.",
  ],
  worked: [
    {
      kind: "text",
      text: "First, how do characters become bytes? UTF-8 stores plain English letters in one byte each, and other characters in two to four bytes, depending on their Unicode number (code point):",
    },
    {
      kind: "table",
      caption: "UTF-8 bytes per character",
      columns: ["character", "code point", "UTF-8 bytes", "byte count"],
      rows: [
        ["a", "U+0061", "97", 1],
        ["é", "U+00E9", "195 169", 2],
        ["न", "U+0928", "224 164 168", 3],
        ["你", "U+4F60", "228 189 160", 3],
        ["🤖", "U+1F916", "240 159 164 150", 4],
      ],
      source: "worked/bytes.py",
    },
    {
      kind: "text",
      text: "Now, a byte-level tokenizer sees those byte sequences, not characters. Here is how GPT-4's and GPT-4o's real tokenizers cut the robot emoji's four bytes:",
    },
    {
      kind: "table",
      caption: "One emoji, cut by two real tokenizers",
      columns: ["tokenizer", "tokens", "bytes in each token", "tokens that are a whole character"],
      rows: [
        ["GPT-4 (cl100k_base)", 3, "240 159 | 164 | 150", "0 of 3"],
        ["GPT-4o (o200k_base)", 2, "240 159 164 | 150", "0 of 2"],
      ],
      source: "worked/bytes.py",
    },
    {
      kind: "text",
      text: "Look closely: neither tokenizer has 🤖 as one entry, so it is spelled from byte pieces, and none of those pieces is a character on its own. Decode either token alone and you get the replacement character `�`. Only when all the bytes have arrived does the emoji appear. The same happens inside Hindi words with GPT-4: `आज` arrives as four tokens, `[224 164] [134] [224 164] [156]`.",
    },
  ],
  concept: [
    {
      heading: "UTF-8: every character as 1–4 bytes",
      paragraphs: [
        "Unicode gives every character a number, its **code point**: `a` is U+0061 (97), `é` is U+00E9 (233), the robot emoji is U+1F916 (129,302). **UTF-8** is the rule for storing those numbers as bytes. Code points below 128 (plain ASCII) take one byte, identical to old ASCII files. Larger ones are split into groups of bits spread over two, three or four bytes, each marked so the decoder knows where a character starts.",
        "The markers live in the top bits. A byte starting with `0` is a complete one-byte character. A byte starting with `110`, `1110` or `11110` begins a 2-, 3- or 4-byte character. Every following byte starts with `10` and carries 6 bits of the code point. Because ASCII stays one byte, starting from bytes costs English nothing compared with starting from characters. And because of the markers, you can start reading anywhere and find the next character boundary, and a byte sequence cut mid-character is detectably incomplete.",
      ],
      formula: {
        expr: "< 0x80:     0xxxxxxx\n< 0x800:    110xxxxx 10xxxxxx\n< 0x10000:  1110xxxx 10xxxxxx 10xxxxxx\notherwise:  11110xxx 10xxxxxx 10xxxxxx 10xxxxxx",
        symbols: [
          { sym: "x", meaning: "the bits of the code point, highest first" },
          { sym: "10xxxxxx", meaning: "a continuation byte: carries 6 bits, never starts a character" },
        ],
        example: "é = 233 = binary 11 101001 → 110 00011, 10 101001 = bytes 195, 169.",
      },
      lab: {
        view: "bytes",
        label: "UTF-8",
        task: "Type `a`, `é`, `न`, `你` and `🤖` one at a time. Predict each byte count before you look. Then try a script you can't read: how many bytes per character?",
      },
    },
    {
      heading: "Byte-level BPE",
      paragraphs: [
        "Byte-level BPE runs the algorithm from steps 3 and 4 with the 256 byte values as the starting symbols. Training merges frequent byte pairs, so common multi-byte characters like `é` quickly become single tokens, then common syllables and words do. GPT-2's vocabulary is exactly 256 bytes + 50,000 merges + 1 special token = 50,257 entries.",
        "The guarantee is total coverage: any text is a sequence of bytes, every byte is in the vocabulary, so nothing is ever unknown. What's *not* guaranteed is efficiency. A character the training text rarely contained gets spelled byte by byte (up to four tokens for one character), which is one source of the token tax on under-represented languages.",
        "You can measure how unevenly the merges were spent. The English sample is 52 bytes, and GPT-4 encodes it in 13 tokens: merges compress it 4.0 times. The Hindi sentence is 108 bytes and takes 45 GPT-4 tokens, only 2.4 times fewer than raw bytes. GPT-4o's larger vocabulary spent far more merges on Hindi: the same sentence takes 14 tokens, a compression of 7.7 times.",
        "Real byte-level tokenizers keep the pre-tokenization step from step 3, splitting text into words, numbers and punctuation first, so merges still stay inside words.",
      ],
      lab: {
        view: "byte-tax",
        label: "Byte tax",
        task: "Compare bytes per token across the samples, first with GPT-4, then GPT-4o. Which language did the bigger vocabulary help most?",
      },
    },
    {
      heading: "Why vocabulary files show Ġ",
      paragraphs: [
        "Open a GPT-2 vocabulary file and you'll see entries like `Ġthe`. What's that `Ġ`? BPE code is written to work on strings, and many bytes aren't printable: byte 32 is a space, byte 10 a newline, and bytes 128–255 aren't valid characters on their own. So GPT-2 uses a fixed table that gives each of the 256 bytes a printable stand-in. Bytes that are already visible (`!` to `~`, and most Latin-1 symbols) stand for themselves; the other 68 get characters from U+0100 upwards, in byte order.",
        "The space is the 33rd byte to be moved, so it becomes U+0120, `Ġ`. That's why GPT-2-style files are full of entries like `Ġthe` (\" the\") and `Ċ` (newline). The stand-ins exist only inside the tokenizer's files; decoding maps them back to the real bytes. And not every format uses them: OpenAI's tiktoken files store each token's raw bytes in base64, so the stand-ins are a GPT-2 convention for readable files, not part of byte-level BPE itself.",
      ],
      mistake:
        "Treating `Ġ` as part of the text, for example stripping it from model output or counting it as a character. It is a stand-in for the space byte, visible only in vocabulary files and debugging output.",
      lab: {
        view: "byte-standins",
        label: "Ġ and friends",
        task: "Type text with spaces, a new line and an accented letter, and read it the way a GPT-2 vocabulary file would print it. Can you decode it back in your head?",
      },
    },
    {
      heading: "Tokens that are not characters",
      paragraphs: [
        "Because merges work on bytes, a token can end in the *middle* of a character, as the emoji and Hindi examples show. That has two practical consequences.",
        "First, **streaming**. Chat interfaces show text as tokens arrive. Decode each token on its own and you print `�` for every partial character. The right approach is an incremental decoder that keeps incomplete bytes in a buffer and only emits complete characters, which is exactly what part 3 builds.",
        "Second, **counting and cutting**. If you truncate a token list to fit a limit, or split it into chunks, the cut can land inside a character, and the decoded edges come out broken. Cut on token boundaries and then decode with `errors=\"replace\"`, or better, nudge the cut to a character boundary. Libraries that count tokens for you handle this, but code that slices token lists by hand often doesn't.",
      ],
      lab: {
        view: "stream-decode",
        label: "Streaming",
        task: "Feed GPT-4's tokens for the robot emoji in one at a time. What does the naive decoder show after each token? When does the safe one finally show something?",
      },
    },
  ],
  guided:
    "Predict how many bytes 🤖 takes, then check in **UTF-8**. Then open **Streaming** and find out how many GPT-4 tokens arrive before you can see the emoji.",
  build: {
    id: "m02-bytes",
    title: "Bytes, stand-ins and safe streaming",
    packages: [],
    data: "tokens",
    parts: [
      part("bytes", "p1", "Write a UTF-8 encoder from the bit layout, and check it against Python's own on a mixed-script sentence.", [
        "Two bytes: `[0xC0 | (cp >> 6), 0x80 | (cp & 0x3F)]`.",
        "Three and four bytes follow the same pattern with `>> 12` and `>> 18`, and `0xE0` / `0xF0` as the first byte's marker.",
      ]),
      part("bytes", "p2", "Write GPT-2's byte → printable-character table, and see why a leading space prints as `Ġ`.", [
        "Loop `for b in range(256)`; if `b` has no stand-in yet, give it `chr(256 + n)` and increase `n`.",
        "Space is byte 32; it is the 33rd byte without a visible character, so it gets `chr(256 + 32)`.",
      ]),
      part("bytes", "p3", "Stream real GPT-4 and GPT-4o tokens to the screen without printing broken characters.", [
        "`codecs.getincrementaldecoder(\"utf-8\")()` keeps unfinished bytes between calls.",
        "Append `decoder.decode(bytes(t[\"bytes\"]))` for each token; it returns `\"\"` until a character is complete.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-bytes-unknown",
      prompt: "Why can't a byte-level BPE tokenizer produce an unknown token, even for a script it never saw?",
      options: [
        "It was trained on every script",
        "Every text is a sequence of bytes, and all 256 byte values are in its base vocabulary",
        "It replaces unseen characters with similar ones",
        "It stores every Unicode character",
      ],
      correctIndex: 1,
      explanation: "Starting from bytes means the worst case is one token per byte: more tokens, but always representable.",
    },
    {
      id: "m02-bytes-stream",
      prompt: "A chat app shows `�` for a moment whenever the model writes an emoji, then the emoji appears correctly. What is the likely bug?",
      options: [
        "The model is unsure about the emoji",
        "The app decodes each token on its own, and the emoji's bytes are spread over several tokens",
        "The font is missing the emoji",
        "The tokenizer has no emoji in its vocabulary",
      ],
      correctIndex: 1,
      explanation: "GPT-4o sends 🤖 as two tokens, neither a full character. An incremental UTF-8 decoder holds the partial bytes and shows nothing until the character is complete.",
    },
  ],
  oneSentence:
    "Byte-level BPE starts from the 256 UTF-8 byte values, so any text can be tokenized without unknowns, at the price of rare characters costing several tokens and some tokens holding only part of a character.",
  deeper: [
    {
      label: "Radford et al. 2019, GPT-2 paper (section 2.2)",
      url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
      adds: "Why GPT-2 moved BPE from characters to bytes, and the trick that keeps merges inside character categories.",
    },
    {
      label: "RFC 3629: UTF-8",
      url: "https://www.rfc-editor.org/rfc/rfc3629",
      adds: "The official definition of the byte layout you implemented in part 1.",
    },
    {
      label: "GPT-2's encoder.py",
      url: "https://github.com/openai/gpt-2/blob/master/src/encoder.py",
      adds: "The original `bytes_to_unicode()` table and how it is used when encoding and decoding.",
    },
  ],
};
