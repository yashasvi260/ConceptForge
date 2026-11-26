import type { DeepLesson } from "../../../core/types";
import { localListing, part } from "./files";

export const sentencepiece: DeepLesson = {
  why: [
    "BPE and WordPiece both begin by splitting text on spaces. That quietly assumes a language puts spaces between words, and Chinese, Japanese and Thai do not. It also makes decoding guess where spaces belong. **SentencePiece**, a tokenizer library from Google, removes the assumption: it treats the input as one raw stream of characters, turns every space into a visible symbol `▁`, and learns pieces that may include it. Decoding is then trivial and exact: join the pieces and turn `▁` back into spaces.",
    "SentencePiece can train BPE, but it is best known for a different algorithm, **Unigram**. Where BPE builds up from characters by merging, Unigram works top-down: it starts with a very large set of candidate pieces, gives each a probability, and repeatedly throws away the pieces that matter least. To tokenize, it does not replay merges; it searches all possible splits for the one with the highest total probability.",
    "You will meet both ideas in real models. T5, ALBERT and XLNet use SentencePiece Unigram; Llama 1 and 2 used SentencePiece BPE; and the `▁` marker appears in their outputs. Unigram also enables a training trick, sampling different splits of the same text, that makes models more robust. This step scores competing splits, writes the Viterbi search that finds the best one, and measures which pieces Unigram training would prune.",
  ],
  worked: [
    {
      kind: "text",
      text: "This step uses the Unigram view's **small illustrative vocabulary** (86 pieces with made-up counts, chosen for teaching; real models learn tens of thousands of pieces). Each piece has a log-probability. A split's score is the sum of its pieces' log-probabilities, so higher (closer to 0) is more probable. Four ways to split `hello world`:",
    },
    {
      kind: "table",
      caption: "Four ways to split hello world",
      columns: ["pieces", "piece count", "log-probability", "probability relative to the best"],
      rows: [
        ["▁hello ▁world", 2, -9.57, 1],
        ["▁hell o ▁world", 3, -14.637, 0.0063],
        ["▁he llo ▁world", 3, -15.107, 0.0039],
        ["▁ h e l l o ▁ w o r l d", 12, -49.378, 0],
      ],
      source: "worked/sentencepiece.py",
    },
    {
      kind: "math",
      text: "log p(▁hello ▁world) = log p(▁hello) + log p(▁world) = -4.741 + -4.829 = -9.570\nrelative to best:  e^(-14.637 − (-9.570)) = e^(-5.067) = 0.0063",
    },
    {
      kind: "text",
      text: "Multiplying probabilities (adding log-probabilities) penalises every extra piece, so splits with fewer, common pieces win by a wide margin. Character-by-character is about e^-40 times less likely: essentially impossible. Viterbi finds the best split without listing them all:",
    },
    {
      kind: "table",
      caption: "The best split Viterbi finds",
      columns: ["text", "best split", "log-probability"],
      rows: [
        ["unbelievable", "▁unbeliev able", -12.191],
        ["tokenization", "▁token ization", -10.715],
        ["strawberry", "▁strawberry", -7.226],
        ["the cat sat", "▁the ▁cat ▁sat", -13.847],
      ],
      source: "worked/sentencepiece.py",
    },
  ],
  concept: [
    {
      heading: "SentencePiece: spaces are just another symbol",
      paragraphs: [
        "SentencePiece first **normalizes** the text (for example collapsing repeated spaces and applying Unicode normalisation), then replaces each space with `▁` (U+2581, a character chosen because it almost never appears in real text) and marks the start of the text the same way. `hello world` becomes `▁hello▁world`. From then on the space is an ordinary symbol, so pieces like `▁hello` (\"hello at the start of a word\") and `llo` (\"llo inside a word\") are naturally different.",
        "This makes the tokenizer **language-independent**: it never needs to know where words are, so Japanese `日本語` and English are handled by the same code. It also makes decoding exact up to normalization: join the pieces and turn every `▁` back into a space. There is no guessing about whether a space belonged before a piece.",
        "SentencePiece is a library and a file format, not a single algorithm. A `.model` file holds the normalization rules, the vocabulary and either BPE merges or Unigram probabilities. Llama 2's tokenizer, for example, is a SentencePiece BPE model with **byte fallback**: characters missing from the vocabulary are spelled as raw bytes, the same idea as step 5.",
      ],
    },
    {
      heading: "Unigram: every piece has a probability",
      paragraphs: [
        "A Unigram tokenizer models text as a sequence of pieces drawn independently, each with its own probability p(piece). The probability of a whole split is the product of its pieces' probabilities, so in log space it is a sum. Different splits of the same text get different scores, and the tokenizer simply picks the highest.",
        "Two effects fall out of this. Fewer pieces usually win, because every extra factor is a probability below 1. And common pieces win over rare ones, because their probabilities are higher. In the worked example `▁hello ▁world` beats `▁hell o ▁world` by a factor of about 160, entirely from those two effects.",
        "It helps to line up the three algorithms. **BPE** stores an ordered merge list and encodes by replaying it, so the first merges learned always take priority. **WordPiece** stores only a vocabulary and encodes by grabbing the longest known piece from the left. **Unigram** stores a probability for every piece and encodes by searching for the most probable split of the whole word. All three produce subwords from a fixed vocabulary; they differ in what is stored and in how a split is chosen, which is why the same word can come out differently in GPT, BERT and T5. The \"Run it locally\" listing shows it: `unaffable` is `un aff able` in GPT-2, `una ##ffa ##ble` in BERT and `▁un aff able` in T5.",
      ],
      formula: {
        expr: "log P(split) = Σ_i log p(piece_i)          best split = argmax over all splits of log P(split)",
        symbols: [
          { sym: "p(piece)", meaning: "the piece's probability; here its count divided by the total count" },
          { sym: "Σ log", meaning: "adding logs is multiplying probabilities, without numbers getting tiny" },
        ],
        example: "log p(▁hell) + log p(o) + log p(▁world) = -14.637, versus -9.570 for ▁hello ▁world.",
      },
      mistake: "Thinking Unigram picks the split with the fewest pieces. It picks the most probable split; that is usually short, but a split into two rare pieces can lose to three common ones.",
    },
    {
      heading: "Viterbi: the best split without trying them all",
      paragraphs: [
        "A word of n characters has 2^(n−1) possible splits, far too many to list. The **Viterbi** algorithm avoids that with one observation: the best split of the first `end` characters must consist of the best split of some shorter prefix plus one final piece. So it fills a table: `best[end]` is the highest score for the first `end` characters, computed by trying every possible last piece `s[start:end]` and adding it to `best[start]`. A second table remembers where the winning last piece started, so the split can be read back from the end.",
        "The work is roughly the text length times the maximum piece length, small enough to run on every input. Single characters that are not in the vocabulary still get a (very low) score so that any text can be tokenized, which is how this step's implementation stays lossless.",
      ],
      formula: {
        expr: "best[0] = 0\nbest[end] = max over start < end of ( best[start] + log p(s[start:end]) )",
        symbols: [
          { sym: "best[end]", meaning: "highest score for the first `end` characters" },
          { sym: "s[start:end]", meaning: "a candidate last piece ending at `end`" },
        ],
        example: "For `▁hello▁world`, best[6] uses the piece `▁hello` (-4.741) and best[12] adds `▁world` (-4.829): -9.570.",
      },
    },
    {
      heading: "Training by pruning, and sampling splits",
      paragraphs: [
        "Unigram training runs the other way from BPE. It starts with a large seed vocabulary (for example all frequent substrings), estimates each piece's probability from how often it is used in the best splits of the training text (an EM procedure), and then measures, for every piece, how much the training text's total log-likelihood would drop if that piece were removed. It keeps the pieces whose removal hurts most, drops the rest (Kudo's paper keeps about 80% per round), and repeats until the vocabulary reaches the target size. Part 3 computes exactly that removal loss.",
        "Because the model assigns probabilities to every split, it can also **sample** a split instead of always taking the best one. Training a model on varied splits of the same sentence, called **subword regularization**, teaches it that `▁hell o` and `▁hello` mean the same thing, which Kudo found helps most in low-resource and out-of-domain translation. At inference time the tokenizer goes back to the single best split.",
      ],
    },
  ],
  guided:
    "Type `hello world` and compare the top three segmentations and their probabilities with the table above. Then try a word that is not in the small vocabulary and see how the best split falls back to smaller pieces and single characters.",
  build: {
    id: "m02-sentencepiece",
    title: "Unigram scoring, Viterbi and pruning",
    packages: [],
    data: "unigram",
    parts: [
      part("sentencepiece", "p1", "Normalize text SentencePiece-style and score splits by summed log-probability.", [
        "`\"▁\" + \"▁\".join(text.split())` collapses spaces and marks every word start.",
        "`sum(VOCAB.get(p, UNK) for p in pieces)` scores a split.",
      ]),
      part("sentencepiece", "p2", "Write Viterbi: the most probable split of any text, read back from a table of best prefix scores.", [
        "Inside the loops: `if lp is not None and best[start] + lp > best[end]:`.",
        "Then set `best[end] = best[start] + lp` and `back[end] = start`.",
      ]),
      part("sentencepiece", "p3", "Measure how much each piece is worth: the drop in corpus log-likelihood when it is removed. Unigram training prunes the cheapest pieces.", [
        "`corpus_loglik(texts, VOCAB) - corpus_loglik(texts, smaller)`.",
        "A piece used by no best split costs exactly 0 to remove.",
      ]),
    ],
  },
  local: [localListing("compare-tokenizers", "GPT-2, BERT and T5 on the same text", ["transformers", "sentencepiece", "tokenizers"])],
  checks: [
    {
      id: "m02-sp-space",
      prompt: "Why does SentencePiece replace spaces with `▁` instead of splitting on them first?",
      options: [
        "To save memory",
        "So it works for languages without spaces and decoding can restore the text exactly",
        "Because `▁` is shorter than a space",
        "To make every word a single token",
      ],
      correctIndex: 1,
      explanation: "Treating the space as an ordinary symbol means no word-splitting step is needed (good for Japanese or Chinese), and decoding is just joining pieces and turning `▁` back into spaces.",
    },
    {
      id: "m02-sp-unigram",
      prompt: "A Unigram tokenizer must choose between `▁un believ able` and `▁unbeliev able`. What decides?",
      options: [
        "The order in which pieces were learned",
        "The longest first piece",
        "Which split has the higher product of piece probabilities (sum of log-probabilities)",
        "Which split has more pieces",
      ],
      correctIndex: 2,
      explanation: "Unigram scores whole splits by probability and Viterbi picks the best. Merge order (BPE) and longest-first matching (WordPiece) play no role.",
    },
    {
      id: "m02-sp-prune",
      prompt: "During Unigram training, which piece is dropped first?",
      options: [
        "The longest piece",
        "The piece whose removal lowers the training text's likelihood the least",
        "The most frequent piece",
        "A random piece",
      ],
      correctIndex: 1,
      explanation: "Training keeps the pieces that matter: removing `▁the` from the example corpus loses 25.9 in log-likelihood, removing an unused piece loses 0, so the unused one goes.",
    },
  ],
  oneSentence:
    "SentencePiece treats spaces as the symbol `▁` so it works on any language and decodes exactly, and its Unigram model gives every piece a probability, finds the most probable split with Viterbi, and trains by pruning the pieces whose removal costs the least.",
  deeper: [
    {
      label: "Kudo 2018, Subword Regularization (Unigram)",
      url: "https://arxiv.org/abs/1804.10959",
      adds: "The Unigram language model, its EM training and pruning, and sampling splits during training.",
    },
    {
      label: "Kudo & Richardson 2018, SentencePiece",
      url: "https://arxiv.org/abs/1808.06226",
      adds: "Why treating text as a raw stream with `▁` makes tokenization language-independent and lossless.",
    },
    {
      label: "google/sentencepiece",
      url: "https://github.com/google/sentencepiece",
      adds: "The library itself: training options, normalization rules, byte fallback and the Python API.",
    },
  ],
};
