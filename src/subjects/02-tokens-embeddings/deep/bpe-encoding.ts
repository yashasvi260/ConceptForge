import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const bpeEncoding: DeepLesson = {
  why: [
    "Training gave us an ordered list of merges. Now the tokenizer has to use it on text it's never seen: a user's question, a new product name, a typo. How?",
    "The rule is simple and strict. Split the word into characters, then replay the learned merges **in the order they were learned**, wherever they fit. Whatever's left is the word's tokens.",
    "This is where BPE earns its keep. `lowest` never appeared in the training text, yet it comes out as two familiar pieces, `low` and `est</w>`, because both were learned from other words. A frequent word collapses to a single token; a rare one keeps a few pieces; something truly new falls back to single characters. Nothing is ever lost, and common text stays short.",
    "It's also where many surprising model behaviours begin. Because merges are replayed mechanically, small changes in spelling, capitals or spacing can produce completely different tokens for what you'd read as the same word. In this step you'll encode words by hand, write the fast version real tokenizers use, and learn to predict a tokenizer's output instead of being surprised by it.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's try it. Use the ten merges learned in step 3 (`e+s`, `es+t`, `est+</w>`, `l+o`, `lo+w`, `n+e`, `ne+w`, `new+est</w>`, `low+</w>`, `w+i`). Encode `lowest` by applying each merge in order; merges that find no match are skipped:",
    },
    {
      kind: "table",
      caption: "Encoding lowest, one merge at a time",
      columns: ["merge applied", "symbols", "count"],
      rows: [
        ["start", "l o w e s t </w>", 7],
        ["e + s", "l o w es t </w>", 6],
        ["es + t", "l o w est </w>", 5],
        ["est + </w>", "l o w est</w>", 4],
        ["l + o", "lo w est</w>", 3],
        ["lo + w", "low est</w>", 2],
      ],
      source: "worked/bpe-encoding.py",
    },
    {
      kind: "text",
      text: "Merges 6 to 10 find nothing to glue, so `lowest` ends as `low` + `est</w>`: 2 tokens instead of 7 characters. The same ten merges on other unseen words:",
    },
    {
      kind: "table",
      caption: "Unseen words through the ten learned merges",
      columns: ["word", "merges that fired", "tokens", "token count"],
      rows: [
        ["lowest", "es, est, est</w>, lo, low", "low est</w>", 2],
        ["newer", "ne, new", "new e r </w>", 4],
        ["slowly", "lo, low", "s low l y </w>", 5],
        ["wider", "wi", "wi d e r </w>", 5],
        ["newest", "es, est, est</w>, ne, new, newest</w>", "newest</w>", 1],
      ],
      source: "worked/bpe-encoding.py",
    },
    {
      kind: "text",
      text: "See the pattern? `newest` was frequent in training, so it's a single token. `slowly` reuses `low` from the middle of the word, and keeps `s`, `l`, `y` as characters because no merge covers them. The token count tells you how familiar a word is to this tokenizer.",
    },
  ],
  concept: [
    {
      heading: "Replaying the merges",
      paragraphs: [
        "Encoding starts exactly like training did: split the word into its base symbols (characters here, bytes in real tokenizers) and add the word-end marker. Then go through the merge list from first to last, and for each merge, glue every place that pair appears. Nothing is counted, nothing is learned. The tokenizer just repeats decisions made during training.",
        "And the result is always valid. Every merge produces a vocabulary entry, and every base symbol is in the vocabulary, so the final pieces are all known IDs. A word full of frequent patterns shrinks to one or two tokens; a word built from rare combinations stays in many small pieces. That graceful fallback is the whole point of subwords: no unknown tokens, and short sequences for common text.",
        "Text is encoded word by word (after pre-tokenization, step 3), and the pieces are joined together. Decoding reverses it: join the pieces and turn each word-end marker back into a space. GPT-style tokenizers store the space at the start of the next word instead, but the principle is identical.",
      ],
      formula: {
        expr: "symbols ← chars(word) + [</w>]\nfor (a, b) in merges, in learned order:  replace every adjacent a b in symbols with ab",
        symbols: [
          { sym: "chars(word)", meaning: "the word split into base symbols" },
          { sym: "merges", meaning: "the ordered list produced by training" },
          { sym: "ab", meaning: "the merged symbol, itself a vocabulary entry" },
        ],
        example: "lowest → l o w e s t </w> → (e+s, es+t, est+</w>, l+o, lo+w) → low est</w>.",
      },
      lab: {
        view: "bpe-encode",
        label: "Encode",
        task: "Before typing, predict the tokens for `lowest`, `newer` and `slowly` using the ten merges. Then type each one and watch which merges fire. Why does `lower` keep `e r </w>` as separate pieces?",
      },
    },
    {
      heading: "Order matters, and ranks make it fast",
      paragraphs: [
        "Does the order of the merges really matter? Try reversing them. `lowest` becomes `lo w es t </w>`: `lo+w` is tried before `l+o` has created `lo`, so it finds nothing, and `est+</w>` and `es+t` are tried before `e+s` has created `es`. That's why a tokenizer ships its merges as an *ordered* list (each merge's position is its **rank**), and why you can't rebuild a tokenizer from its vocabulary alone.",
        "Walking through 50,000 merges for every word would be slow. So real tokenizers turn it around: look at the word's current neighbouring pairs, find the one with the lowest rank (the merge learned earliest), merge it, and repeat until no pair has a rank. Because earlier merges always take priority, this gives the same result as replaying the whole list, but only does as many steps as the word actually has merges. GPT-2's original `encoder.py` is exactly this loop, plus a cache so each distinct word is only encoded once.",
      ],
      formula: {
        expr: "rank(a, b) = position of (a, b) in the merge list\nrepeat: (a, b) ← the adjacent pair with the smallest rank;  stop if no adjacent pair has a rank",
        symbols: [
          { sym: "rank", meaning: "0 for the first merge learned, 1 for the second, …" },
          { sym: "adjacent pair", meaning: "two neighbouring symbols in the word as it is now" },
        ],
        example: "In `n e w e s t </w>` the pair `e s` has rank 0 (the first merge), so it is merged first.",
      },
      mistake:
        "Assuming BPE finds the split with the fewest tokens. It does not search; it replays merges greedily in training order. A shorter split can exist and still not be chosen. (Unigram, step 7, does search for the most probable split.)",
      lab: {
        view: "merge-order",
        label: "Merge order",
        task: "Encode `lowest` with the merges as learned, then reversed, then shuffled a few times. How many different splits can the same ten merges produce?",
      },
    },
    {
      heading: "What happens to anything new",
      paragraphs: [
        "A new word is split as far as the learned merges allow, and the rest stays as base symbols. That's why unusual words cost more tokens: a misspelling, a long product code, or a word from a language the tokenizer saw little of all break into many small pieces. A word can take anywhere from 1 token (a frequent word) up to one per base symbol (nothing applies).",
        "You can turn this into a measurement. Encode a sample of your own documents and compute tokens per word. If it's much higher than for ordinary English, the tokenizer is poorly matched to your domain (chemical names, legal citations, a language it saw little of). You'll pay more per request and fit less into the context window, so it's worth comparing other models' tokenizers, or, when fine-tuning, adding a few frequent domain terms as tokens (step 2).",
        "If the base symbols are characters, there's one hole left: a character never seen in training (an emoji, a rare script) has no base symbol at all. Starting from the 256 byte values instead closes that hole, because every character is made of bytes. That's step 5, and it's what GPT-2 and every later GPT tokenizer does.",
      ],
      lab: {
        view: "fertility",
        label: "Fertility",
        task: "Compare `slowly` with its typo `slowwly`, then add a word from your own field. Which costs the most GPT-4o tokens? What would that mean for a document full of such words?",
      },
    },
    {
      heading: "Deterministic, and sensitive",
      paragraphs: [
        "Encoding is deterministic: the same text always gives the same tokens. But it isn't robust to small edits. In GPT-4o's tokenizer `strawberry` is `st` + `raw` + `berry`, ` strawberry` with a leading space is a single token, and `STRAWBERRY` is four pieces. To the model these are different inputs that it has to learn are related, which is part of why models struggle with spelling tasks (step 10).",
        "Spacing matters in practice too. A prompt that ends with a trailing space leaves the next word's leading space stranded, and the model has rarely seen a word without its space in training, which can subtly hurt the continuation. Functions that build prompts for you, like chat templates, handle these boundaries consistently; hand-built prompts are worth checking with the real tokenizer.",
      ],
      lab: {
        view: "variants",
        label: "Variants",
        task: "Type a word you use often and compare its four forms. Which form is a single token? What does that tell you about how the word usually appears in text?",
      },
    },
  ],
  guided:
    "Before typing in **Encode**, predict the tokens for `lowest`, `newer` and `slowly`. Then open **Merge order** and find out what reversing the merges does to `lowest`.",
  build: {
    id: "m02-bpe-encoding",
    title: "Encode and decode with learned merges",
    packages: [],
    data: "bpe",
    parts: [
      part("bpe-encoding", "p1", "Encode a word by replaying the learned merges in order, and see that a different order gives a different split.", [
        "`for pair in merges: symbols = apply_merge(symbols, pair)`.",
        "`apply_merge` is already written for you; `encode_word` only needs the loop.",
      ]),
      part("bpe-encoding", "p2", "Write the fast version real tokenizers use: repeatedly merge the adjacent pair with the lowest rank. It must agree with part 1.", [
        "`min(pairs, key=lambda p: rank.get(p, float(\"inf\")))` finds the earliest-learned pair; unknown pairs get infinity.",
        "If that best pair is not in `rank`, no merge applies any more: `break`.",
      ]),
      part("bpe-encoding", "p3", "Tokenize a whole sentence and decode it back to the exact text.", [
        "Encode each word from `text.split()` and flatten: `[t for w in ... for t in encode_by_rank(w, merges)]`.",
        "`\"\".join(tokens).replace(\"</w>\", \" \").strip()` restores the spaces.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-bpe-enc-order",
      prompt: "Why must a BPE tokenizer store its merges in order, not just its vocabulary?",
      options: [
        "To save disk space",
        "Because encoding replays merges by rank, and the same merges in another order can produce a different split",
        "Because the vocabulary is sorted alphabetically",
        "Because decoding needs the merge order",
      ],
      correctIndex: 1,
      explanation: "With the ten merges reversed, `lowest` becomes `lo w es t </w>` instead of `low est</w>`. The model was trained on the in-order splits, so the order is part of the tokenizer.",
    },
    {
      id: "m02-bpe-enc-rare",
      prompt: "A customer types `slowwly` (a typo). Compared with `slowly`, what do you expect from a BPE tokenizer?",
      options: [
        "An unknown token",
        "Exactly the same tokens",
        "More, smaller pieces, because fewer learned merges match the misspelled letters",
        "Fewer tokens, because the word is longer",
      ],
      correctIndex: 2,
      explanation: "BPE never fails, it degrades: merges that matched the correct spelling no longer apply around the typo, so more of the word stays in small pieces.",
    },
  ],
  oneSentence:
    "BPE encodes new text by replaying its learned merges in order (in practice: repeatedly merging the lowest-ranked adjacent pair), so familiar words become one token, unfamiliar ones become a few pieces, and nothing is ever unknown.",
  deeper: [
    {
      label: "GPT-2's encoder.py",
      url: "https://github.com/openai/gpt-2/blob/master/src/encoder.py",
      adds: "The `bpe()` method is the lowest-rank loop from part 2, with a per-word cache.",
    },
    {
      label: "tiktoken's educational BPE",
      url: "https://github.com/openai/tiktoken/blob/main/tiktoken/_educational.py",
      adds: "A readable Python version of byte-level BPE training and encoding, with visualisation of each merge.",
    },
    {
      label: "Hugging Face LLM course: BPE tokenization",
      url: "https://huggingface.co/learn/llm-course/chapter6/5",
      adds: "Encoding with learned merges on a fresh example, including how unknown characters are handled.",
    },
  ],
};
