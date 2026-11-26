import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const wordpiece: DeepLesson = {
  why: [
    "Not every model uses BPE. BERT, and the many models built on it (DistilBERT, ELECTRA, and MiniLM, the embedding model running in this module), use **WordPiece**. You will meet WordPiece output constantly when you work with embedding and classification models, and it looks different: pieces such as `##face` and `##ization`, a vocabulary of 30,522 entries, and lower-cased, accent-free text.",
    "WordPiece differs from BPE in two places. **Encoding** does not replay merges; it keeps only the vocabulary and, at each position, grabs the longest piece it knows (greedy longest-match), marking pieces that continue a word with `##`. If any part of a word matches nothing, the whole word becomes `[UNK]`. **Training** also merges pairs, but chooses them with a score that favours pairs whose parts rarely appear apart, instead of raw frequency.",
    "Knowing these rules lets you read BERT-family output and predict its failures: why `unaffable` comes out as `una ##ffa ##ble` and not the textbook `un ##aff ##able`, why an emoji inside a word can wipe out the whole word, and why `Café` and `cafe` are the same token. This step encodes words with BERT's real vocabulary and compares WordPiece's training score with BPE's.",
  ],
  worked: [
    {
      kind: "text",
      text: "Encode five words with **BERT's real vocabulary** (`bert-base-uncased`). At each position, try the longest remaining substring first and shorten it until it is in the vocabulary; any piece after the first is written with `##` in front:",
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
      text: "`unaffable` shows the greedy rule at work. `una` is in BERT's vocabulary, so it wins over `un` simply for being longer, and the rest must then start at `ffa`. Many tutorials show `un ##aff ##able`, but `##aff` is not in BERT's vocabulary at all. Now training: on step 3's corpus, compare the first pairs each method would merge.",
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
        "WordPiece encoding needs only the vocabulary. Start at the beginning of the word and look for the longest substring that is a vocabulary entry; take it, move past it, and repeat from there. Every piece after the first must be looked up with a `##` prefix, because the vocabulary stores word-internal pieces separately: `##s` (ID 2015) and `s` are different entries with different vectors, one meaning \"s inside a word\" and the other \"s on its own\".",
        "There is no merge list and no ranking. That makes WordPiece simple to implement and fast to run, but also greedy in a way that can surprise you: the longest first piece is always chosen, even when a shorter first piece would lead to a more natural split, as `una ##ffa ##ble` shows. The model was trained on these exact splits, so they are \"right\" for the model even when they look wrong to a linguist.",
        "Before WordPiece runs, BERT applies a **basic tokenizer**: lowercasing (for uncased models), removing accents, and splitting on whitespace and punctuation. That is why `Café` becomes `cafe` (ID 7668) and why punctuation is always its own token in BERT.",
        "Uncased versus cased is a real choice when you pick a BERT-family model. Uncased models throw away capitals and accents, so `Apple` the company and `apple` the fruit look identical, but the vocabulary is spent on fewer variants of each word. Cased models keep the distinction, which helps tasks such as finding names in text, at the cost of more pieces for capitalised and accented words.",
        "Greedy matching as written tries every shorter substring at every position, which is slow for long words. Production tokenizers store the vocabulary in a prefix tree (a trie) so that one pass along the word finds the longest match, and Google's later Fast WordPiece work makes the whole encoding run in time proportional to the text's length.",
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
    },
    {
      heading: "All or nothing: the whole word becomes [UNK]",
      paragraphs: [
        "BPE can always fall back to characters or bytes. WordPiece cannot: if some position in a word matches no piece at all, it gives up on the entire word and emits a single `[UNK]`. A word that is 95% recognisable but contains one character missing from the vocabulary (an emoji, an unusual symbol, a character from a script BERT barely covers) loses all its meaning, not just the odd character.",
        "BERT's original implementation also maps any word longer than 200 characters straight to `[UNK]`. In practice this all-or-nothing behaviour matters most for user-generated text such as chat messages full of emoji, and for languages and symbols outside the vocabulary. Multilingual and newer models reduce the problem with larger vocabularies or byte fallback, but the classic BERT tokenizer behaves exactly as described.",
      ],
      mistake: "Assuming `[UNK]` replaces only the unknown character. In WordPiece it replaces the whole word, so `robot🤖` becomes a single `[UNK]` and the word `robot` is lost too.",
    },
    {
      heading: "Training: a score instead of a count",
      paragraphs: [
        "WordPiece builds its vocabulary bottom-up like BPE, merging one pair at a time, but it chooses the pair with the highest **score**: the pair's count divided by the counts of its two parts. Dividing by the parts' frequencies rewards pairs whose parts rarely appear apart. In the worked example, `i` and `d` each occur only 3 times and always together, so `i + d` scores 0.333 and is merged first, while BPE picks `e + s` because it is simply the most frequent pair.",
        "Intuitively, BPE asks \"which pair saves the most length?\" and WordPiece asks \"which pair is most surprising to see together, compared with chance?\" The second question tends to glue together pieces that form a unit, at the cost of compressing the text a little less. Google never published its WordPiece training code, so libraries such as Hugging Face `tokenizers` implement this score as their best reconstruction from the papers.",
      ],
      formula: {
        expr: "score(a, b) = count(ab) / (count(a) × count(b))",
        symbols: [
          { sym: "count(ab)", meaning: "how often a is immediately followed by b in the training words" },
          { sym: "count(a), count(b)", meaning: "how often each part appears at all" },
        ],
        example: "l + o: 7 / (7 × 7) = 0.143, because l and o each appear 7 times and always as `lo`.",
      },
    },
    {
      heading: "When you will meet WordPiece",
      paragraphs: [
        "Most text-embedding and classification models in common use descend from BERT and inherit its WordPiece vocabulary. MiniLM (all-MiniLM-L6-v2) uses BERT's uncased vocabulary exactly, so the IDs above are the IDs MiniLM sees, which is why `bank` is 2,924 in both. When you count tokens for an embedding model's input limit (256 word pieces for MiniLM), you count WordPiece pieces, not GPT tokens.",
        "Because the vocabulary is smaller and English-centred, WordPiece models split rare and technical words into many pieces (`kubernetes` takes four), which can push long documents past the input limit sooner than you expect. Check the piece count with the model's own tokenizer before choosing a chunk size for retrieval.",
      ],
    },
  ],
  guided:
    "Type `huggingface` and predict the pieces before looking, then try `unaffable` and explain why the greedy rule picks `una`. Finally type `Café` and a word with an emoji inside it, and explain what happens to each.",
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
