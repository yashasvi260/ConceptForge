import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const vocabulary: DeepLesson = {
  why: [
    "Every tokenizer comes with a **vocabulary**: the fixed, ordered list of every piece it can produce. And a token's ID? It's nothing more than that piece's position in the list. BERT's list has 30,522 entries, GPT-2's 50,257, GPT-4's 100,277, Llama 3's 128,256 and GPT-4o's 200,019. People chose those numbers before training, and they can't be changed afterwards without retraining.",
    "So how big should the list be? That's one of the few tokenizer settings with consequences you can actually measure. A bigger vocabulary holds longer, more varied pieces, so the same text needs fewer tokens: cheaper requests, faster answers, more text in the same context window. But every entry needs its own row of numbers inside the model, at the input and usually again at the output. So a bigger vocabulary means a bigger model, and very rare entries get too little training to be useful.",
    "Once you see this trade-off, a lot of choices you'll meet make sense: why small models have proportionally huge embedding tables, why newer models keep growing their vocabularies to serve more languages, and why adding your own tokens when fine-tuning means adding rows to the model. In this step you'll build a vocabulary from scratch, then measure what it costs and what it buys in real models.",
  ],
  worked: [
    {
      kind: "text",
      text: "Let's price it. Each vocabulary entry gets a row of `d_model` numbers in the model's **embedding table** (step 11 shows the lookup). So the table has vocabulary size × d_model parameters. Models that do not reuse the same table for their output layer (untied embeddings) pay for it twice.",
    },
    {
      kind: "table",
      caption: "Vocabulary size and the embedding table",
      columns: ["model", "vocabulary", "d_model", "table parameters (V × d)", "% of all parameters"],
      rows: [
        ["GPT-2 small", 50257, 768, 38597376, 31],
        ["Llama 3 8B", 128256, 4096, 525336576, 13.1],
        ["GPT-3 175B", 50257, 12288, 617558016, 0.4],
      ],
      source: "worked/vocabulary.py",
    },
    {
      kind: "math",
      text: "GPT-2 small (tied):   50,257 × 768 = 38,597,376        38,597,376 / 124,439,808 = 31.0%\nLlama 3 8B (untied):  128,256 × 4,096 = 525,336,576    2 × 525,336,576 / 8,030,261,248 = 13.1%",
    },
    {
      kind: "text",
      text: "Surprised? In a small model the vocabulary is almost a third of everything; in a giant model it is a rounding error. Now the other side: what does a bigger vocabulary save? GPT-4o's vocabulary is twice GPT-4's. Run both on the six sample texts from the Languages view (English, Spanish, Hindi, Japanese, code, numbers):",
    },
    {
      kind: "table",
      caption: "Doubling the vocabulary: GPT-4 vs GPT-4o on the six sample texts",
      columns: ["tokenizer", "vocabulary size", "total tokens"],
      rows: [
        ["GPT-4 (cl100k_base)", 100277, 140],
        ["GPT-4o (o200k_base)", 200019, 93],
      ],
      source: "worked/vocabulary.py",
    },
    {
      kind: "text",
      text: "33.6% fewer tokens for the same text, and almost all of the saving comes from Hindi (45 → 14) and Japanese (28 → 17); English, code and numbers barely move. A bigger vocabulary mostly buys better coverage of what the smaller one handled badly.",
    },
  ],
  concept: [
    {
      heading: "A vocabulary is an ordered list",
      paragraphs: [
        "A vocabulary maps each piece to an integer and back, and the integer is just the position. In BERT's `vocab.txt`, line 2,925 is `bank`, so `bank` has ID 2,924 (counting from 0). The same file gives `[PAD]` = 0, `[UNK]` = 100, `[CLS]` = 101 and `[SEP]` = 102. Those are **special tokens**: ordinary entries with reserved meanings (step 8). MiniLM, the embedding model in this module, reuses BERT's vocabulary exactly, which is why its `bank` is also 2,924.",
        "Here's a subtle point. Pieces can carry markers that are part of the entry itself. In BERT, `##s` is a different entry from `s`: the `##` means \"continues the previous piece\" (step 6). In GPT-style vocabularies a leading space is part of the piece, so ` cat` and `cat` are two different IDs. So two tokenizers of the same size can behave completely differently. The list *is* the tokenizer.",
        "And since IDs are positions, they mean nothing outside their own list. GPT-4's ID 279 is ` the`; GPT-4o's ` the` is 290. That's why a model must always be used with its own tokenizer, and why the tokenizer files (`vocab.txt`, `merges.txt`, or a single `tokenizer.json`) are published right next to the weights.",
      ],
      formula: {
        expr: "id = vocab.index(piece)      piece = vocab[id]      0 ≤ id < V",
        symbols: [
          { sym: "vocab", meaning: "the ordered list of every piece the tokenizer can produce" },
          { sym: "V", meaning: "vocabulary size: BERT 30,522; GPT-2 50,257; GPT-4o 200,019" },
        ],
        example: "In BERT, vocab.index(\"bank\") = 2924 and vocab[101] = \"[CLS]\".",
      },
      lab: {
        view: "vocab",
        label: "Vocabularies",
        task: "Switch between raw bytes, GPT-4 and GPT-4o. Predict which gives the fewest tokens for the sample, then check. What does each choice cost in table size?",
      },
    },
    {
      heading: "What a bigger vocabulary costs",
      paragraphs: [
        "Inside the model, each ID selects one row of the **embedding table**: a matrix with V rows and d_model columns. At the other end, the **output head** turns the final vector back into one score per vocabulary entry, which needs another V × d_model matrix. Some models **tie** the two (GPT-2 and GPT-3 reuse the input table as the output head). Others keep them separate (Llama 3), and pay twice.",
        "The output head also costs compute on *every* generated token. Scoring each of V entries takes V × d_model multiply-adds, then a softmax over V numbers. For Llama 3 8B that's 128,256 × 4,096 ≈ 525 million multiply-adds per token, just for the last layer. Double V, and that doubles too.",
        "And there's a quieter cost. A row only gets trained when its entry appears in the training data. Spread the same data over more entries, and the rare ones are seen less often, so their rows stay poorly trained. Step 10 shows the extreme case: entries that almost never appeared in training, and make models behave strangely.",
      ],
      formula: {
        expr: "vocabulary parameters = V × d_model × (1 if tied else 2)",
        symbols: [
          { sym: "V", meaning: "vocabulary size" },
          { sym: "d_model", meaning: "length of each token's vector (768 in GPT-2 small, 4,096 in Llama 3 8B)" },
          { sym: "tied", meaning: "whether the output head reuses the input embedding table" },
        ],
        example: "Going from GPT-4's 100,277 entries to GPT-4o's 200,019 in an untied model with d_model = 4,096 adds 2 × 99,742 × 4,096 = 817,086,464 parameters.",
      },
      mistake:
        "Treating the vocabulary as free. In a small model the tables can be a third of all parameters, so a vocabulary sized for a giant model can crowd out the layers that do the actual work.",
      lab: {
        view: "vocab-cost",
        label: "Cost",
        task: "Start from GPT-2 small and slide the vocabulary up to 200,000. What share of the model is now vocabulary? Then pick Llama 3 8B and untie the head: what happens?",
      },
    },
    {
      heading: "What a bigger vocabulary buys",
      paragraphs: [
        "So what do you get for all those extra rows? Longer pieces, and so fewer tokens per text. Fewer tokens is cheaper (APIs bill per token), faster (generation makes one token per step), and fits more text into the context window. But the saving is uneven: languages and domains the smaller vocabulary covered badly gain the most. That's why newer tokenizers grew their vocabularies partly to serve more languages fairly.",
        "And the saving compounds inside the model. Attention compares every token with every other, so its work grows with the square of the sequence length (Module 03). A Hindi passage that takes 45 tokens with GPT-4's tokenizer and 14 with GPT-4o's needs about a tenth of the attention work, and leaves room for roughly three times as much Hindi in the same context window. For someone writing in Hindi, the vocabulary decides how much the model can read at once.",
        "Research on scaling suggests the best vocabulary size grows with the model: a tiny model can't afford a huge table, while a large model wastes capacity on long sequences if its vocabulary is too small. That matches the trend in released models, from 30k–50k entries around 2019 to 128k–200k today.",
      ],
      lab: {
        view: "vocab-buys",
        label: "What it buys",
        task: "Which sample saves the most tokens going from GPT-4 to GPT-4o? Which saves nothing at all? Why might that be?",
      },
    },
    {
      heading: "Changing a vocabulary in practice",
      paragraphs: [
        "Will you ever design a vocabulary from scratch? Rarely. You'll usually inherit the one that comes with a pretrained model. But when you fine-tune, you might want new entries: domain terms, product codes, new special tokens for a chat format. Adding them means growing the embedding table (and the output head) by one row each. Libraries like Hugging Face Transformers do this with `resize_token_embeddings`. The new rows start untrained, so the model needs enough examples to learn them.",
        "How the new rows start matters. Random rows sit far from everything the model knows, so its first outputs involving them are noise. A common, simple fix is to start each new row at the average of the existing rows (or of the rows for the pieces the new token used to be split into), so the model begins from a sensible guess instead of nonsense.",
        "Removing entries is harder, because every other ID would shift. That's one more reason IDs are treated as fixed forever, once a model is trained.",
      ],
      lab: {
        view: "add-tokens",
        label: "Adding tokens",
        task: "Add 20 domain terms to Llama 3 8B, then to GPT-2 small. Why does Llama pay twice per token? How many examples would each new row need to become useful?",
      },
    },
  ],
  guided:
    "Predict first: in GPT-2 small, what share of all parameters is the vocabulary table? Check in **Cost**. Then open **What it buys** and find the language that gains the most from GPT-4o's bigger vocabulary.",
  build: {
    id: "m02-vocabulary",
    title: "Build a vocabulary, then price it",
    packages: [],
    data: "vocab",
    parts: [
      part("vocabulary", "p1", "Build a word vocabulary (specials first, most frequent first), then write `encode` and `decode` with an `<unk>` fallback.", [
        "`sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))` orders by count, high to low, then alphabetically.",
        "`index.get(w, index[\"<unk>\"])` falls back to the unknown token's ID.",
      ]),
      part("vocabulary", "p2", "Encode word pieces with **BERT's real IDs**, wrapped in `[CLS]` … `[SEP]` the way BERT expects.", [
        "Start the list with `ids[\"[CLS]\"]` and end it with `ids[\"[SEP]\"]`.",
        "`ids.get(t, ids[\"[UNK]\"])` handles pieces missing from the vocabulary.",
      ]),
      part("vocabulary", "p3", "Price a vocabulary: table size, share of the model, and the extra parameters of going from GPT-4's vocabulary to GPT-4o's.", [
        "`vocab_share` is `100 × copies × vocab × d_model / total_params`, with `copies = 1` for tied embeddings and 2 otherwise.",
        "`extra_params` only counts the new rows: `(new_vocab − old_vocab) × d_model`, times the number of tables.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-vocab-small-model",
      prompt: "You are designing a small 120M-parameter model with d_model = 768. Why might a 200,000-entry vocabulary be a poor choice?",
      options: [
        "Because IDs above 65,535 cannot be stored",
        "Because the embedding table alone would be about 154M parameters, more than the whole model budget",
        "Because large vocabularies make tokenization slower than the model",
        "Because a large vocabulary always produces more tokens",
      ],
      correctIndex: 1,
      explanation: "200,000 × 768 = 153.6M parameters for one table, before any transformer layers. Small models spend a large share on vocabulary already (GPT-2 small: 31%), so the vocabulary has to fit the model.",
    },
    {
      id: "m02-vocab-ids",
      prompt: "Why can't you feed GPT-4o's token IDs into a Llama 3 model?",
      options: [
        "Llama 3 only accepts IDs below 100,000",
        "An ID is just a position in one tokenizer's list, so the same number points at a different piece in another vocabulary",
        "GPT-4o's IDs are encrypted",
        "Llama 3 has no embedding table",
      ],
      correctIndex: 1,
      explanation: "IDs mean nothing outside their own vocabulary: GPT-4's ` the` is 279, GPT-4o's is 290, and Llama 3 has its own list again. Always encode with the model's own tokenizer.",
    },
  ],
  oneSentence:
    "A vocabulary is the fixed, ordered list of pieces a tokenizer can produce, IDs are positions in it, and its size trades fewer tokens per text against V × d_model parameters per embedding table.",
  deeper: [
    {
      label: "Hugging Face: summary of the tokenizers",
      url: "https://huggingface.co/docs/transformers/tokenizer_summary",
      adds: "How BPE, WordPiece and Unigram vocabularies are built, and the base vocabulary sizes of well-known models.",
    },
    {
      label: "Tao et al. 2024, Scaling Laws with Vocabulary",
      url: "https://arxiv.org/abs/2407.13623",
      adds: "A study of how the best vocabulary size grows with model size and compute.",
    },
    {
      label: "BERT's vocab.txt",
      url: "https://huggingface.co/google-bert/bert-base-uncased/blob/main/vocab.txt",
      adds: "The real 30,522-line file: special tokens at the top, `##` continuation pieces, and `bank` on line 2,925.",
    },
  ],
};
