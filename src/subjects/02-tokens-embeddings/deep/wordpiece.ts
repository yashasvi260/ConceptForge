import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const wordpiece: DeepLesson = {
  why: [
    "Not every model uses BPE. BERT, and the many models built on it (DistilBERT, ELECTRA, and MiniLM, the embedding model running in this module), use **WordPiece**. You'll meet WordPiece output constantly when you work with embedding and classification models, and it looks different: pieces like `##face` and `##ization`, a vocabulary of 30,522 entries, and text that's been lower-cased with its accents removed.",
    "So what's different? Two places. **Encoding** doesn't replay merges. It keeps only the vocabulary, and at each position it grabs the longest piece it knows (greedy longest-match), marking pieces that continue a word with `##`. If any part of a word matches nothing, the *whole word* becomes `[UNK]`. **Training** also merges pairs, but picks them with a score that favours pairs whose parts rarely appear apart, instead of raw frequency.",
    "Once you know these rules, you can read BERT-family output and predict its failures: why `unaffable` comes out as `una ##ffa ##ble` and not the textbook `un ##aff ##able`, why an emoji inside a word can wipe out the whole word, and why `Café` and `cafe` are the same token. In this step you'll encode words with BERT's real vocabulary and compare WordPiece's training score with BPE's.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's try it on real data. Encode five words with **BERT's real vocabulary** (`bert-base-uncased`). At each position, try the longest remaining substring first and shorten it until it is in the vocabulary; any piece after the first is written with `##` in front:",
    },
    {
      kind: "table",
      caption: "Greedy longest-match with BERT's real vocabulary",
      columns: ["word", "pieces", "IDs", "piece count"],
      rows: [
        ["huggingface", "hugging ##face", "17662 12172", 2],
        ["unaffable", "una ##ffa ##ble", "14477 20961 3468", 3],
        ["tokenization", "token ##ization", "19204 3989", 2],
        ["embeddings", "em ##bed ##ding ##s", "7861 8270 4667 2015", 4],
        ["kubernetes", "ku ##ber ##net ##es", "13970 5677 7159 2229", 4],
      ],
      source: "worked/wordpiece.py",
    },
    {
      kind: "text",
      text: "Look at `unaffable`: it shows the greedy rule at work. `una` is in BERT's vocabulary, so it wins over `un` simply for being longer, and the rest must then start at `ffa`. Many tutorials show `un ##aff ##able`, but `##aff` is not in BERT's vocabulary at all. Now training: on step 3's corpus, compare the first pairs each method would merge.",
    },
    {
      kind: "table",
      caption: "Which pair goes first: BPE count vs WordPiece score",
      columns: ["rank", "BPE: pair", "count", "WordPiece: pair", "score"],
      rows: [
        [1, "e + s", 9, "i + d", 0.333],
        [2, "s + t", 9, "l + o", 0.143],
        [3, "t + </w>", 9, "s + t", 0.111],
        [4, "w + e", 8, "o + w", 0.062],
      ],
      source: "worked/wordpiece.py",
    },
    {
      kind: "math",
      text: "score(a, b) = count(ab) / (count(a) × count(b))\ni + d:  3 / (3 × 3)  = 0.333     (i and d only ever appear together, in widest)\ne + s:  9 / (17 × 9) = 0.059     (e is everywhere, so e s is less special)",
    },
  ],
  concept: [
    {
      heading: "Greedy longest-match encoding",
      paragraphs: [
        "WordPiece encoding needs only the vocabulary. Start at the beginning of the word and find the longest substring that's a vocabulary entry; take it, move past it, and repeat from there. Every piece after the first must be looked up with a `##` prefix, because the vocabulary stores word-internal pieces separately: `##s` (ID 2015) and `s` are different entries with different vectors, one meaning \"s inside a word\" and the other \"s on its own\".",
        "No merge list, no ranking. That makes WordPiece simple and fast, but greedy in a way that can surprise you: the longest first piece always wins, even when a shorter first piece would lead to a more natural split, as `una ##ffa ##ble` shows. And the model was trained on exactly these splits, so they're \"right\" for the model, even when they look wrong to a linguist.",
        "Before WordPiece even runs, BERT applies a **basic tokenizer**: lower-casing (for uncased models), removing accents, and splitting on whitespace and punctuation. That's why `Café` becomes `cafe` (ID 7668), and why punctuation is always its own token in BERT.",
        "Uncased vs cased is a real choice when you pick a BERT-family model. Uncased models throw away capitals and accents, so `Apple` the company and `apple` the fruit look identical, but the vocabulary is spent on fewer variants of each word. Cased models keep the distinction, which helps tasks like finding names in text, at the cost of more pieces for capitalised and accented words.",
        "Greedy matching as written tries every shorter substring at every position, which is slow for long words. Production tokenizers store the vocabulary in a prefix tree (a trie), so one pass along the word finds the longest match, and Google's later Fast WordPiece work makes the whole encoding run in time proportional to the text's length.",
      ],
      formula: {
        expr: "at position i: piece = longest s in vocab such that s = (\"##\" if i > 0 else \"\") + word[i:j]\nif no such s exists:  the whole word → [UNK]",
        symbols: [
          { sym: "word[i:j]", meaning: "the substring from position i up to j, tried with j from the end of the word downwards" },
          { sym: "##", meaning: "marks a piece that continues the previous one inside the same word" },
          { sym: "[UNK]", meaning: "ID 100 in BERT: the unknown token" },
        ],
        example: "huggingface: the longest prefix in the vocabulary is `hugging`; the rest, `face`, is found as `##face` → [17662, 12172].",
      },
      lab: {
        view: "wordpiece",
        label: "WordPiece",
        task: "Type `huggingface` and predict the pieces first. Then try `unaffable`: why does the greedy rule pick `una`? Finally type `Café`.",
      },
    },
    {
      heading: "All or nothing: the whole word becomes [UNK]",
      paragraphs: [
        "BPE can always fall back to characters or bytes. WordPiece can't. If some position in a word matches no piece at all, it gives up on the *entire word* and emits a single `[UNK]`. So a word that's 95% recognisable but contains one character missing from the vocabulary (an emoji, an unusual symbol, a character from a script BERT barely covers) loses all its meaning, not just the odd character.",
        "BERT's original implementation also maps any word longer than 200 characters straight to `[UNK]`. In practice this all-or-nothing behaviour bites hardest on user-generated text like chat messages full of emoji, and on languages and symbols outside the vocabulary. Multilingual and newer models reduce the problem with larger vocabularies or byte fallback, but the classic BERT tokenizer behaves exactly as described.",
      ],
      mistake:
        "Assuming `[UNK]` replaces only the unknown character. In WordPiece it replaces the whole word, so `robot🤖` becomes a single `[UNK]` and the word `robot` is lost too.",
      lab: {
        view: "wp-unk",
        label: "[UNK] rule",
        task: "Type a few words with emoji stuck to them. Which words survive, and which vanish into `[UNK]`? Now put a space before the emoji: what changes?",
      },
    },
    {
      heading: "Training: a score instead of a count",
      paragraphs: [
        "WordPiece builds its vocabulary bottom-up like BPE, merging one pair at a time. But it chooses the pair with the highest **score**: the pair's count divided by the counts of its two parts. Dividing by the parts' frequencies rewards pairs whose parts rarely appear apart. In the worked example, `i` and `d` each occur only 3 times, always together, so `i + d` scores 0.333 and goes first, while BPE picks `e + s` simply because it's the most frequent pair.",
        "Here's an intuitive way to put it. BPE asks, \"which pair saves the most length?\" WordPiece asks, \"which pair is most surprising to see together, compared with chance?\" The second question tends to glue together pieces that form a real unit, at the cost of compressing the text a little less. Google never published its WordPiece training code, so libraries like Hugging Face `tokenizers` implement this score as their best reconstruction from the papers.",
      ],
      formula: {
        expr: "score(a, b) = count(ab) / (count(a) × count(b))",
        symbols: [
          { sym: "count(ab)", meaning: "how often a is immediately followed by b in the training words" },
          { sym: "count(a), count(b)", meaning: "how often each part appears at all" },
        ],
        example: "l + o: 7 / (7 × 7) = 0.143, because l and o each appear 7 times and always as `lo`.",
      },
      lab: {
        view: "wp-score",
        label: "Score vs count",
        task: "Compare the first pairs BPE and WordPiece would merge on the corpus. Then add a word whose letters always appear together, like `qqzz`. Which method merges it first?",
      },
    },
    {
      heading: "When you will meet WordPiece",
      paragraphs: [
        "Most text-embedding and classification models in common use descend from BERT and inherit its WordPiece vocabulary. MiniLM (all-MiniLM-L6-v2) uses BERT's uncased vocabulary exactly, so the IDs above are the IDs MiniLM sees, which is why `bank` is 2,924 in both. And when you count tokens for an embedding model's input limit (256 word pieces for MiniLM), you count WordPiece pieces, not GPT tokens.",
        "Because the vocabulary is smaller and English-centred, WordPiece models split rare and technical words into many pieces (`kubernetes` takes four), which can push long documents past the input limit sooner than you'd expect. So check the piece count with the model's own tokenizer before choosing a chunk size for retrieval.",
      ],
      lab: {
        view: "wp-fertility",
        label: "BERT vs GPT-4o",
        task: "Compare BERT's pieces with GPT-4o's tokens for some technical words from your own field. Which tokenizer needs more? What would that mean for a 256-piece limit?",
      },
    },
  ],
  guided:
    "Predict the pieces for `huggingface` before typing it into **WordPiece**. Then open **[UNK] rule** and find a word that loses all its meaning because of one character.",
  build: {
    id: "m02-wordpiece",
    title: "WordPiece with BERT's real vocabulary",
    packages: [],
    data: "wordpiece",
    parts: [
      part("wordpiece", "p1", "Write greedy longest-match encoding and reproduce real BERT splits, including the surprising `una ##ffa ##ble`.", [
        "Inner loop: try `end = len(word)` down to `start + 1`; build `sub = (\"##\" if start else \"\") + word[start:end]`.",
        "Stop at the first `sub` found in the vocabulary; if none is found, return `None` for the whole word.",
      ]),
      part("wordpiece", "p2", "Turn text into BERT IDs, with the all-or-nothing `[UNK]` rule for words that do not fully match.", [
        "`pieces is None` means the word failed: append `vocab[\"[UNK]\"]` once.",
        "Otherwise `ids.extend(vocab[p] for p in pieces)`.",
      ]),
      part("wordpiece", "p3", "Compare training rules: the first pair BPE merges (highest count) and the first WordPiece merges (highest score).", [
        "`max(pair, key=pair.get)` is BPE's choice.",
        "For WordPiece use `key=lambda p: pair[p] / (sym[p[0]] * sym[p[1]])`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-wp-unk",
      prompt: "A BERT model receives the word `great👍`. The emoji is not in its vocabulary. What does WordPiece produce?",
      options: ["`great` and `[UNK]`", "A single `[UNK]` for the whole word", "`great` only; the emoji is dropped", "The emoji's bytes"],
      correctIndex: 1,
      explanation: "WordPiece is all or nothing per word: if any position matches no piece, the entire word becomes one `[UNK]`. (BERT's basic tokenizer may split some symbols off as punctuation first, but anything left inside a word follows this rule.)",
    },
    {
      id: "m02-wp-score",
      prompt: "Why does WordPiece's training score divide a pair's count by the counts of its parts?",
      options: [
        "To make training faster",
        "To favour pairs whose parts rarely appear apart, so merged pieces tend to be real units",
        "To keep the vocabulary sorted",
        "To give rare words their own tokens",
      ],
      correctIndex: 1,
      explanation: "A frequent pair of very common symbols (like `e s`) is not special; a pair whose parts almost only appear together (like `i d` in the example) is. BPE uses the raw count and asks which merge saves the most length instead.",
    },
  ],
  oneSentence:
    "WordPiece, BERT's tokenizer, encodes each word by greedily taking the longest known piece and continuing with `##` pieces, turns the whole word into `[UNK]` if any part fails, and learns its vocabulary by merging pairs whose parts rarely appear apart.",
  deeper: [
    {
      label: "Hugging Face LLM course: WordPiece tokenization",
      url: "https://huggingface.co/learn/llm-course/chapter6/6",
      adds: "WordPiece training and encoding worked step by step, and the scoring formula used to reconstruct Google's algorithm.",
    },
    {
      label: "BERT's tokenization.py",
      url: "https://github.com/google-research/bert/blob/master/tokenization.py",
      adds: "The original basic tokenizer and greedy longest-match WordpieceTokenizer, including the 200-character limit.",
    },
    {
      label: "Wu et al. 2016, Google's NMT system",
      url: "https://arxiv.org/abs/1609.08144",
      adds: "Where WordPiece was used at scale for translation, with the reasoning behind the vocabulary size.",
    },
  ],
};
