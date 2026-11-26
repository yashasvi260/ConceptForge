import type { LessonStep } from "../../core/types";

/**
 * Facts here are checked in docs/research/tokenization-sources.md.
 * 14 steps (deep-lessons design 2026-11-26): merged steps keep the first original step's id and list their views.
 */
export const steps: LessonStep[] = [
  {
    id: "why-numbers",
    title: "Why tokens: three ways to chop text",
    summary: "A language model is a giant calculator, and calculators can't read. Text has to become numbers first.",
    body: [
      "Think of a library that files every book by a catalogue number. Librarians don't need to read the cover; they work with the number. A model works the same way: before it does anything, your text is cut into pieces called **tokens**, and each token is swapped for its ID number.",
      "The program that does the cutting and numbering is the **tokenizer**. It runs before the model and after it: your prompt goes text → token IDs → model, and the model's answer comes back as token IDs → text.",
      "Everything you hear about LLM limits is counted in tokens, not words: price per million tokens, context windows, max output length. Understanding tokens explains most of the odd behaviour you'll meet.",
      "Think LEGO. Building only from single 1×1 studs works for any shape but takes thousands of pieces (**characters**: tiny vocabulary, very long sequences). Casting a custom piece for every object is fast to build with, but you'd need an endless catalogue, and anything new can't be built at all (**words**: huge vocabulary, and unknown words become `[UNK]`).",
      "Standard bricks are the sweet spot: common shapes get their own brick, rare ones are built from smaller bricks (**subwords**). `tokenizer` might stay one piece while a rare word like `unbelievably` becomes two or three.",
      "Every modern LLM uses subwords. The next steps show how a tokenizer decides which bricks to keep."
    ],
    tryIt: "Type anything into the sample box and watch each piece get its ID from GPT-4o's real tokenizer.",
    keyTakeaway: "A model never sees letters or words, only a list of token IDs.",
    section: "Tokens",
    view: "intro",
    views: [
      {
        "view": "intro",
        "label": "Overview"
      },
      {
        "view": "chop",
        "label": "Three ways"
      }
    ],
  },
  {
    id: "vocabulary",
    title: "The vocabulary",
    summary: "The vocabulary is the tokenizer's phrasebook: every entry has a number, and the ID is just its position.",
    body: [
      "A phrasebook with more entries lets you say things in fewer, bigger chunks. The same holds for tokenizers: a bigger vocabulary means fewer tokens per text, which is cheaper and fits more into the model's context.",
      "The cost: every entry needs its own row in the model's **embedding table** (a list of numbers per token, covered in this module's Embeddings section), so a bigger vocabulary means a bigger model, and very rare entries get little training.",
      "Real sizes: BERT 30,522; GPT-2 50,257; GPT-4 (`cl100k_base`) about 100k; Llama 3 128,256; GPT-4o (`o200k_base`) about 200k. The trend is toward bigger vocabularies, partly to serve more languages well."
    ],
    tryIt: "Switch between raw bytes, GPT-4 and GPT-4o and compare the token count with the embedding-table size.",
    keyTakeaway: "Bigger vocabulary means fewer tokens per text but a bigger embedding table. Every model picks a balance.",
    section: "Tokens",
    view: "vocab",
  },
  {
    id: "bpe-training",
    title: "BPE: learning the pieces",
    summary: "Byte-Pair Encoding builds its vocabulary by gluing together the pair of symbols that appears together most often, again and again.",
    body: [
      "It's how texting shorthand evolves: pairs you type constantly get their own symbol. BPE starts with single characters (plus an end-of-word marker `</w>`), counts every adjacent pair in the training text, and merges the most frequent pair into a new symbol. Then it counts again and repeats.",
      "Each merge adds exactly one entry, so the final vocabulary = the starting characters + the number of merges. The number of merges is the only setting you choose (Sennrich et al., 2016).",
      "The corpus here is the paper's own example: `low` ×5, `lower` ×2, `newest` ×6, `widest` ×3. Watch `e`+`s` merge first: it appears 9 times, in `newest` and `widest`. (`s`+`t` and `t`+`</w>` also appear 9 times; this tie goes to the pair seen first.)"
    ],
    tryIt: "Press `Next merge` and watch the pair counts change. Then paste your own sentences into the corpus.",
    keyTakeaway: "BPE training is a loop: count adjacent pairs, merge the most frequent, repeat.",
    section: "Tokens",
    view: "bpe-train",
  },
  {
    id: "bpe-encoding",
    title: "BPE: tokenizing new words",
    summary: "To tokenize text, BPE replays the merges it learned, in the same order it learned them.",
    body: [
      "Like spelling an unfamiliar name from syllables you know: `lowest` never appeared in training, but `low` and `est` did. The tokenizer splits the word into characters, then applies merge #1, merge #2 and so on, wherever they fit.",
      "Frequent words end up as a single token. Rare words fall back to smaller pieces, and in the worst case to single characters. Nothing is ever truly unknown as long as its characters are known.",
      "The order matters: the same merges applied in a different order can give a different split, which is why a tokenizer ships its merge list along with its vocabulary."
    ],
    tryIt: "Type `lowest`, then `newer` and `slowly`. See which merges apply and in what order.",
    keyTakeaway: "Encoding = split into characters, then apply the learned merges in their learned order.",
    section: "Tokens",
    view: "bpe-encode",
  },
  {
    id: "bytes",
    title: "Bytes: never an unknown token",
    summary: "Computers store every character as bytes. Start BPE from the 256 possible bytes and no text can ever be unknown.",
    body: [
      "UTF-8 stores `a` as 1 byte, `é` as 2, `你` or `न` as 3 and `🤖` as 4. GPT-2 introduced **byte-level BPE**: its base vocabulary is the 256 bytes, then 50,000 merges, plus one end-of-text token = 50,257.",
      "Because every possible string is made of bytes, an emoji, a typo or an alphabet the tokenizer barely saw still tokenizes, just into more pieces. That's why GPT-style models never output `[UNK]`.",
      "A side effect: a token can be part of a character. In vocabulary listings you'll also see `Ġ` at the start of many tokens. It's how GPT-2-style tokenizers print a leading space byte, so `Ġthe` is \" the\"."
    ],
    tryIt: "Type characters from different scripts and an emoji, and count their bytes.",
    keyTakeaway: "Byte-level BPE can encode any text at all; rare characters just cost more tokens.",
    section: "Tokens",
    view: "bytes",
  },
  {
    id: "wordpiece",
    title: "WordPiece (BERT)",
    summary: "BERT's tokenizer keeps only a vocabulary and always grabs the longest piece it knows, marking word continuations with `##`.",
    body: [
      "Like reading a long German word by spotting the biggest dictionary word at the start, then the next. WordPiece takes the longest vocabulary entry that matches the start of the word, then continues with pieces written `##…` that may only appear inside a word. If any part can't be matched, the **whole word** becomes `[UNK]`.",
      "Training is similar to BPE, but a pair's score is its frequency divided by the frequencies of its two parts, which favours pairs whose parts are rare on their own.",
      "This step uses the real `bert-base-uncased` vocabulary (30,522 entries), which lower-cases text and strips accents. Fun fact: the textbook example `unaffable → un ##aff ##able` isn't what real BERT does: `##aff` isn't in its vocabulary."
    ],
    tryIt: "Try `huggingface`, `unaffable`, `Café` and a word with an emoji inside it.",
    keyTakeaway: "WordPiece: greedy longest match, `##` means \"continues the word\", and any failure makes the whole word `[UNK]`.",
    section: "Tokens",
    view: "wordpiece",
  },
  {
    id: "sentencepiece",
    title: "SentencePiece and Unigram",
    summary: "Treat spaces as just another symbol, and choose the most probable way to split the text.",
    body: [
      "Many languages (Chinese, Japanese, Thai) don't put spaces between words, so splitting on spaces first doesn't work. **SentencePiece** works on raw text and turns every space into `▁`, so the text can be restored by joining the pieces and turning `▁` back into spaces. It's lossless up to normalisation: steps such as collapsing repeated spaces happen before splitting.",
      "**Unigram** (Kudo, 2018) works the other way round from BPE. It starts with a huge vocabulary and repeatedly drops the 10–20% of pieces that matter least. Each piece has a probability; to tokenize, the Viterbi algorithm finds the split with the highest total probability.",
      "Because it knows several likely splits, Unigram can sample different ones during training (**subword regularisation**), which Kudo found helps most with little training data or out-of-domain text. T5 uses Unigram; SentencePiece can also run BPE."
    ],
    tryIt: "Type a phrase and compare the top three segmentations and their probabilities.",
    keyTakeaway: "SentencePiece: spaces become `▁` so it's lossless. Unigram: pick the most probable split.",
    section: "Tokens",
    view: "unigram",
  },
  {
    id: "special-tokens",
    title: "Special tokens and chat templates",
    summary: "Some tokens aren't text at all: they're signals like \"start\", \"end\" or \"next speaker\".",
    body: [
      "Like the punctuation of a radio conversation (\"over\", \"over and out\"), special tokens structure the input. BERT wraps sentences in `[CLS]` and `[SEP]`, pads batches with `[PAD]` and hides words with `[MASK]`. GPT models mark the end of a document with `<|endoftext|>`.",
      "Chat models turn a conversation into one token stream with a **chat template**. Llama 3 writes `<|start_header_id|>user<|end_header_id|>`, the message, then `<|eot_id|>` (end of turn). The model learned to answer when it sees the assistant header.",
      "Security matters here: if a user types the text `<|eot_id|>`, the tokenizer must treat it as ordinary characters, never as the real control token. Otherwise users could fake the end of their turn and inject fake system or assistant messages."
    ],
    tryIt: "Type `<|eot_id|>` into the user message and see it stay ordinary text.",
    keyTakeaway: "Special tokens are control signals with reserved IDs; user text must never be allowed to produce them.",
    section: "Tokens",
    view: "special",
  },
  {
    id: "playground",
    title: "Real tokenizers: languages, code and numbers",
    summary: "See exactly how GPT-4o and GPT-4 tokenize your text, with real IDs.",
    body: [
      "These are OpenAI's actual vocabularies (from the open-source tiktoken project), running entirely in your browser. No model and no API: just the tokenizer, so nothing you type leaves your computer.",
      "Notice how most tokens start with a space, how common words are one token, and how GPT-4o (≈200k vocabulary) usually needs fewer tokens than GPT-4 (≈100k) for the same text.",
      "Pieces like `<0xE0>` are bytes that make up only part of a character. Several tokens together form that one character.",
      "Tokenizers learn their merges mostly from English-heavy data, so English gets long, efficient tokens while other scripts get chopped finer. Our Hindi sentence takes **45 tokens** in GPT-4's tokenizer but **14** in GPT-4o's, whose bigger vocabulary has far more Hindi pieces.",
      "More tokens means a higher price, less room in the context window and slower answers for the same meaning, a real fairness issue for non-English users.",
      "Code tokenizes into many small pieces (brackets, operators, indentation), and numbers are cut into chunks of up to three digits."
    ],
    tryIt: "Paste a paragraph from an email, some code or a URL, and compare the two counts.",
    keyTakeaway: "Different models use different tokenizers, so always count tokens with the tokenizer of the model you'll call.",
    section: "Tokens",
    view: "playground",
    views: [
      {
        "view": "playground",
        "label": "Playground"
      },
      {
        "view": "languages",
        "label": "Languages"
      }
    ],
  },
  {
    id: "quirks",
    title: "Quirks, cost and context limits",
    summary: "Many famous LLM blunders are really tokenization problems.",
    body: [
      "Ask GPT-4o \"How many r's are in strawberry?\" and ` strawberry` (with its leading space) arrives as a **single token**; on its own, `strawberry` is `st` `raw` `berry`. Either way the model never sees ten separate letters, so it has to recall the spelling instead of reading it. Reversing words, counting characters and rhyming suffer the same way.",
      "Small changes matter: `strawberry` is 3 tokens but ` strawberry` (with a leading space) is 1, and `STRAWBERRY` is 4. Numbers like `1234567` become `123` `456` `7`, so digit-by-digit arithmetic gets harder.",
      "**Glitch tokens**: GPT-2's vocabulary had a single token for ` SolidGoldMagikarp`, a Reddit username common in the tokenizer's training data but almost absent from the model's. GPT-3-era models, which used the same vocabulary, barely learned it and behaved strangely when prompted with it (Rumbelow & Watkins, 2023).",
      "APIs bill per token (usually quoted per million, often with different prices for input and output) and every model has a **context window**: the most tokens it can handle at once, prompt plus answer. `max_tokens` caps how long the answer may be.",
      "For retrieval-augmented generation (RAG), documents are split into **chunks** measured in tokens, often with some overlap so a sentence cut at a boundary still appears whole in one chunk.",
      "A rough rule of thumb for English is about 4 characters, or ¾ of a word, per token; our sample on step 1 comes out at about that. For anything that matters, count with the real tokenizer instead of guessing."
    ],
    tryIt: "Open each card, then try your own tricky word in the box.",
    keyTakeaway: "If a task depends on letters or digits, remember the model sees chunks, not characters.",
    section: "Tokens",
    view: "quirks",
    views: [
      {
        "view": "quirks",
        "label": "Quirks"
      },
      {
        "view": "practice",
        "label": "Cost & context"
      }
    ],
  },
  {
    id: "lookup-table",
    title: "From token ID to vector: the embedding table",
    summary: "A token ID is just a row number. The model looks up that row in a big table of learned numbers.",
    body: [
      "Remember the phrasebook from the Vocabulary step? Now each entry also has a long list of numbers next to it. Turning token `2924` into numbers is literally reading row 2924 of the **embedding table**.",
      "MiniLM, the model running in your browser, has a table of **30,522 rows × 384 numbers** (its vocabulary is exactly BERT's, so the IDs match the WordPiece step). Those numbers start random and are adjusted during training until useful patterns emerge.",
      "This lookup is the first thing the model does. Everything after it (Module 03) works on these vectors, never on text."
    ],
    tryIt: "Type a sentence and follow each word piece to its row number in the table.",
    keyTakeaway: "Embedding lookup = take row `token_id` of a learned table: ID in, vector out.",
    callout: "vector = E[token_id]   (E: 30,522 × 384 for MiniLM)",
    section: "Embeddings",
    view: "lookup",
  },
  {
    id: "static-vs-contextual",
    title: "Static vs contextual: watching “bank” shift",
    summary: "The table gives every word one fixed vector. The transformer then reshapes it to fit the sentence.",
    body: [
      "A **static** embedding (the table row, or older methods like word2vec) is the same for `bank` in every sentence: one vector for all its meanings.",
      "A **contextual** embedding is what comes out after the transformer layers. Each token's vector has been mixed with information from its neighbours, so `bank` comes out different in every sentence.",
      "On the right: the static similarity of `bank` with itself is always 1.00; MiniLM's contextual `bank` vectors across real sentences never are.",
      "Pick two sentences that both contain `bank`. The visualizer takes MiniLM's contextual vector for `bank` in each and compares them with cosine similarity (1.00 = identical direction).",
      "With the defaults, the river-bank and the loan-bank vectors land at about 0.83. Try two river sentences: they come out closer (about 0.90).",
      "Be honest about the limits: MiniLM is small and trained for sentence similarity, so it doesn't separate senses perfectly (two different money sentences aren't always closer than money vs river). The shift is real; the separation is partial."
    ],
    tryIt: "Look at how far apart the contextual `bank` vectors are in each pair.",
    keyTakeaway: "Static = one vector per word, everywhere. Contextual = a fresh vector per word per sentence.",
    callout: "cos(a, b) = (a · b) / (‖a‖ ‖b‖)",
    section: "Embeddings",
    view: "static-contextual",
    views: [
      {
        "view": "static-contextual",
        "label": "Static vs contextual"
      },
      {
        "view": "bank-shift",
        "label": "Bank shift"
      }
    ],
  },
  {
    id: "sentence-embeddings",
    title: "Sentence vectors and similarity",
    summary: "Average the token vectors and you get one vector for the whole sentence.",
    body: [
      "Many tasks need one vector per text, not per token. The simplest recipe is **mean pooling**: average all the token vectors. MiniLM averages every position, including its special `[CLS]` and `[SEP]` markers, then scales the result to length 1.",
      "Long documents are usually split into chunks first (MiniLM reads at most 256 word pieces), and each chunk gets its own vector.",
      "These sentence vectors are what search engines, clustering and recommendation systems store and compare.",
      "Cosine similarity compares the **direction** of two vectors: 1 means the same direction, 0 means unrelated. For MiniLM's sentence vectors, related texts typically score well above unrelated ones, which sit near zero.",
      "A similarity matrix makes it visible at a glance: questions about logins light up together, while weather and revenue sit apart.",
      "There's no universal threshold for “similar”: it depends on the model and the task, so you calibrate on your own data."
    ],
    tryIt: "Watch the token vectors (rows) being averaged into the sentence vector at the bottom.",
    keyTakeaway: "Sentence embedding = pool the token vectors (MiniLM: mean, then normalise to length 1).",
    callout: "sentence = normalise(mean(token vectors))",
    section: "Embeddings",
    view: "sentence-emb",
    views: [
      {
        "view": "sentence-emb",
        "label": "Mean pooling"
      },
      {
        "view": "similarity",
        "label": "Similarity matrix"
      }
    ],
  },
  {
    id: "cheat-sheet",
    title: "Recap: build a semantic search",
    summary: "Embed the question, embed the documents, return the closest ones: that's semantic search.",
    body: [
      "Type “I can't sign in to my account”: it shares no keywords with any document (only small words like “I” and “my”), yet the password and login questions rank first because their vectors point the same way.",
      "This is the retrieval half of RAG (Module 09), and the same vectors power classification (Module 06) and clustering (Module 07).",
      "Use this card to review before the challenge, or as a reference later. Each line links back to an idea you've already played with.",
      "The **Further reading** list points to the original papers and official documentation, so you can check any claim yourself."
    ],
    tryIt: "Search for something that uses different words from the documents.",
    keyTakeaway: "Tokenizers turn text into IDs; embeddings turn IDs into vectors whose closeness means similar meaning.",
    section: "Summary",
    view: "search-preview",
    views: [
      {
        "view": "search-preview",
        "label": "Search"
      },
      {
        "view": "cheatsheet",
        "label": "Cheat sheet"
      }
    ],
  },
];
