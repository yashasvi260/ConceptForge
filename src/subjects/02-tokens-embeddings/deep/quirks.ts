import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const quirks: DeepLesson = {
  why: [
    "Tokens are the unit everything around a model is measured in. You pay per token, separately for what you send and what comes back. The **context window**, the most a model can handle at once, is counted in tokens, and it holds the prompt *and* the answer together. Long documents are cut into token-sized **chunks** before they're searched (Module 09). Estimate tokens badly, and requests fail at the limit, bills surprise you, and retrieval quietly drops text.",
    "Tokens also explain a family of failures that look like the model being careless. Ask a model how many r's are in strawberry, and it sees one or three tokens, not ten letters; it has to *remember* each token's spelling instead of reading it. Reversing a word, counting characters, rhyming and long arithmetic all ask the model to work below the level it actually sees. And a few tokens are stranger still: entries that were in the tokenizer's vocabulary but almost never in the model's training text, which make models behave erratically.",
    "So this step collects the practical side of tokenization: why the popular \"4 characters per token\" rule only works for English, how to price a request, how to fit a long conversation into a fixed window, and how to chunk a document with overlap so nothing important gets cut in half. Each one is a few lines of code you'll reuse.",
  ],
  worked: [
    {
      kind: "text",
      text: "You've probably heard the rule of thumb: one token is about 4 characters of text. Does it hold? Test it against the real GPT-4o counts for the six sample texts (positive error = the rule overestimates):",
    },
    {
      kind: "table",
      caption: "The 4-characters rule of thumb vs real GPT-4o counts",
      columns: ["text", "characters", "estimate (chars / 4)", "real GPT-4o tokens", "error %"],
      rows: [
        ["English", 52, 13, 12, 8],
        ["Spanish", 50, 12.5, 12, 4],
        ["Hindi", 42, 10.5, 14, -25],
        ["Japanese", 24, 6, 17, -65],
        ["Code", 48, 12, 21, -43],
        ["Numbers", 33, 8.25, 17, -51],
      ],
      source: "worked/quirks.py",
    },
    {
      kind: "text",
      text: "So, does it hold? For English and Spanish the rule is within 10%. For Japanese, code and numbers it undercounts by half or more, exactly the kinds of text that need care. Now chunking: split a 1,000-token document into windows, with and without overlap between neighbours.",
    },
    {
      kind: "table",
      caption: "Chunking a 1,000-token document",
      columns: ["chunk size", "overlap", "chunks", "tokens stored"],
      rows: [
        [200, 0, 5, 1000],
        [200, 50, 7, 1300],
        [500, 0, 2, 1000],
        [500, 100, 3, 1200],
      ],
      source: "worked/quirks.py",
    },
    {
      kind: "math",
      text: "size 200, overlap 50 → each chunk starts 150 tokens after the last: 0, 150, 300, 450, 600, 750, 900\nchunks 1–6 hold 200 tokens, chunk 7 holds tokens 900–999 (100):  6 × 200 + 100 = 1,300 stored",
    },
  ],
  concept: [
    {
      heading: "Why models fumble letters, digits and spelling",
      paragraphs: [
        "In GPT-4o's tokenizer, ` strawberry` with its leading space is one token, `strawberry` without it is `st` + `raw` + `berry`, and `STRAWBERRY` is four pieces. None of these shows the individual letters. So to count the r's, the model has to have learned how each of those tokens is spelled, then count across token boundaries. It often can, but it's *recalling* rather than reading, and the error rate is far higher than for tasks at the level of whole tokens.",
        "The same goes for reversing a word, counting characters, finding rhymes and solving anagrams. Numbers have the related problem from step 9: digits come in chunks of three that don't line up with place value. The practical fixes work around the tokenizer: ask for the word spelled out with spaces first (so each letter becomes its own token), or hand the job to code, which sees characters directly.",
      ],
      mistake:
        "Concluding that a model \"can't count\" or \"is careless\" from letter-level tasks. It is answering a question about units it never sees; restate the task at the token level, or use a tool.",
      lab: {
        view: "quirks",
        label: "Quirks",
        task: "Open each card and predict the tokens before revealing them. Then type a tricky word of your own: how many letters can the model actually \"see\"?",
      },
    },
    {
      heading: "Glitch tokens",
      paragraphs: [
        "A tokenizer is trained on one text collection, and the model on another. What happens if a string was common in the first, but almost absent from the second? It gets its own vocabulary entry whose embedding row barely moves during training. In 2023, Rumbelow and Watkins found such entries in the GPT-2/GPT-3 vocabulary, the best-known being ` SolidGoldMagikarp` (a Reddit username). Prompted with them, GPT-3-era models evaded, insulted, or replied with unrelated words.",
        "Glitch tokens are rare in modern tokenizers, which are usually trained on text closer to the model's. But the lesson generalises: every vocabulary entry needs enough training examples to be useful, and that's the hidden cost of very large vocabularies from step 2.",
      ],
      lab: {
        view: "glitch",
        label: "Glitch token",
        task: "Check ` SolidGoldMagikarp` in GPT-2's real vocabulary, then in GPT-4o's. Try ` petertodd` too. Why would one token that almost never appeared in training behave so strangely?",
      },
    },
    {
      heading: "Cost and the context window",
      paragraphs: [
        "API prices are quoted per million tokens, usually with a higher price for output than for input, and sometimes with discounts for input the provider has cached from an earlier request. A request costs input tokens times the input price, plus output tokens times the output price. And since chat applications resend the whole conversation every turn, input grows with the conversation's length, so long chats get steadily more expensive per message.",
        "The growth is faster than it looks. If every turn adds about 200 tokens and the whole history is resent each time, turn k sends 200 × k input tokens. So a 20-turn chat sends 200 × (1 + 2 + … + 20) = 200 × 210 = 42,000 input tokens in total, more than ten times the 4,000 tokens the conversation actually contains. Total input grows with the *square* of the number of turns, which is why long-running assistants trim, summarise or cache their history.",
        "The context window caps prompt and answer **together**. A model with a 128,000-token window that gets a 120,000-token prompt can write at most 8,000 tokens back, however high you set the output limit (`max_tokens` in many APIs). When a conversation outgrows the window, something has to go. The simplest policy keeps the system message and the most recent turns that fit, dropping the oldest; summarising old turns (Module 10) keeps more information, at the cost of an extra model call.",
        "For anything that matters (billing estimates, limits, batching), count with the model's own tokenizer: tiktoken for OpenAI models, the Hugging Face tokenizer for open models. The rule of thumb is for rough English estimates only, as the worked example shows.",
      ],
      formula: {
        expr: "cost = input_tokens × price_in / 10⁶ + output_tokens × price_out / 10⁶\nmax answer = context_window − prompt_tokens",
        symbols: [
          { sym: "price_in, price_out", meaning: "dollars per million tokens, from your provider's current price sheet" },
          { sym: "context_window", meaning: "the model's limit on prompt + answer, in tokens" },
        ],
        example: "With made-up example prices of $2.50 in and $10.00 out per million: 1,000 in + 500 out = 0.0025 + 0.0050 = $0.0075.",
      },
      lab: {
        view: "practice",
        label: "Cost & context",
        task: "Paste a long text, set a price and a context window, and change the chunk size and overlap. How many requests would it take to read the whole document?",
      },
    },
    {
      heading: "Chunking with overlap",
      paragraphs: [
        "Retrieval systems (Module 09) store documents as chunks with a fixed number of tokens, because embedding models have input limits (256 word pieces for MiniLM), and because smaller pieces match questions more precisely. But a hard cut every N tokens will sometimes split the very sentence that answers a question across two chunks, and then neither half matches well.",
        "**Overlap** fixes that. Each chunk starts `size − overlap` tokens after the previous one, so the last `overlap` tokens of a chunk repeat at the start of the next, and any sentence shorter than the overlap appears whole somewhere. The price is storage and search work: with 200-token chunks and 50 tokens of overlap, a 1,000-token document becomes 7 chunks and 1,300 stored tokens, instead of 5 and 1,000. Real systems often cut on sentence or paragraph boundaries first and use token counts only as a limit, which Module 09 compares.",
      ],
      formula: {
        expr: "start_k = k × (size − overlap)        chunk_k = ids[start_k : start_k + size]",
        symbols: [
          { sym: "size", meaning: "tokens per chunk" },
          { sym: "overlap", meaning: "tokens shared by neighbouring chunks; must be smaller than size" },
        ],
        example: "size 500, overlap 100: chunks start at 0, 400, 800, giving 3 chunks and 1,200 stored tokens for 1,000 tokens.",
      },
      lab: {
        view: "chunker",
        label: "Chunker",
        task: "Set chunk size 16 and overlap 0, then raise the overlap to 4. Which sentences were cut in half before, and which now appear whole in some chunk? What does it cost?",
      },
    },
  ],
  guided:
    "Before opening **Quirks**, predict how many GPT-4o tokens ` strawberry` (with a leading space) takes. Then use **Chunker** to find the smallest overlap that keeps every sentence of the sample whole somewhere.",
  build: {
    id: "m02-quirks",
    title: "Estimate, budget and chunk with tokens",
    packages: [],
    data: "tokens",
    parts: [
      part("quirks", "p1", "Test the 4-characters rule of thumb against real GPT-4o counts, and price a request with separate input and output prices.", [
        "`error_pct`: `round(100 * (estimate − real) / real)` with `real = row[\"o200k_base\"]`.",
        "`request_cost`: `(input_tokens * prices[\"input\"] + output_tokens * prices[\"output\"]) / 1_000_000`.",
      ]),
      part("quirks", "p2", "Respect the context window: how much room is left for the answer, and which turns of a long chat to keep.", [
        "`max(0, context_window - prompt_tokens)` never goes negative.",
        "Walk `reversed(turns[1:])`, `insert(0, t)` each turn that fits, and `break` at the first that doesn't.",
      ]),
      part("quirks", "p3", "Chunk a token list with overlap, the way retrieval systems prepare documents.", [
        "Append `ids[start:start + size]`; if `start + size >= len(ids)` you are done.",
        "Otherwise move on by `size - overlap` tokens.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-quirks-strawberry",
      prompt: "Why might a model miscount the r's in \"strawberry\"?",
      options: [
        "It skips letters to save time",
        "It sees the word as one to three tokens, not ten letters, so it must recall each token's spelling",
        "Its vocabulary has no letter r",
        "Counting is disabled in language models",
      ],
      correctIndex: 1,
      explanation: "In GPT-4o, ` strawberry` is a single token and `strawberry` is `st raw berry`. Spelling the word out first (one letter per token) or using code avoids the problem.",
    },
    {
      id: "m02-quirks-window",
      prompt: "A model has a 128,000-token context window. Your prompt is 125,000 tokens and you set max_tokens to 10,000. What happens?",
      options: [
        "You get a 10,000-token answer",
        "The answer can be at most 3,000 tokens, because prompt and answer share the window",
        "The prompt is compressed automatically",
        "The window grows to fit",
      ],
      correctIndex: 1,
      explanation: "The window holds prompt + answer. Depending on the API, the request is rejected or the answer is cut at 3,000 tokens.",
    },
    {
      id: "m02-quirks-overlap",
      prompt: "Why add overlap between chunks of a document for retrieval?",
      options: [
        "To make chunks smaller",
        "So a sentence cut at a chunk boundary still appears whole in a neighbouring chunk",
        "To reduce the number of chunks",
        "Because embedding models require it",
      ],
      correctIndex: 1,
      explanation: "Overlap repeats the end of each chunk at the start of the next. It costs extra storage (1,300 tokens stored instead of 1,000 in the example) in exchange for fewer answers split in half.",
    },
  ],
  oneSentence:
    "Tokens explain models' trouble with letters and digits and set every practical limit: count them with the real tokenizer (the 4-characters rule only holds for English), price input and output separately, remember the window holds prompt and answer together, and chunk documents with overlap.",
  deeper: [
    {
      label: "OpenAI Cookbook: counting tokens with tiktoken",
      url: "https://cookbook.openai.com/examples/how_to_count_tokens_with_tiktoken",
      adds: "Counting tokens for prompts and chat messages exactly, including the per-message overhead of chat formats.",
    },
    {
      label: "Rumbelow & Watkins 2023, SolidGoldMagikarp",
      url: "https://www.lesswrong.com/posts/aPeJE8bSo6rAFoLqg/solidgoldmagikarp-plus-prompt-generation",
      adds: "How the glitch tokens were found and what GPT-3 did when shown them.",
    },
    {
      label: "OpenAI: what are tokens and how to count them",
      url: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them",
      adds: "The official rules of thumb, with the caveat that other languages tokenize differently.",
    },
  ],
};
