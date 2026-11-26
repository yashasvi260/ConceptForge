import type { DeepLesson } from "../../../core/types";
import { part } from "./files";

export const playground: DeepLesson = {
  why: [
    "Steps 3 to 8 built tokenizers from first principles. Real tokenizers are those same algorithms trained on huge, uneven text collections, and their behaviour on your text is something you can measure rather than guess. This step works with the real tokenizers of GPT-4 (`cl100k_base`, about 100k entries) and GPT-4o (`o200k_base`, about 200k), which run in this page through OpenAI's open-source tiktoken vocabularies.",
    "Three kinds of text behave very differently. **Languages**: English is cheap, and other languages pay a \"token tax\" that depends heavily on which tokenizer you use. **Code**: brackets, operators and indentation tokenize into many small pieces, so source files cost more tokens than prose of the same length. **Numbers**: modern GPT tokenizers cut digit runs into chunks of up to three, from the left, which is efficient for storage but awkward for arithmetic.",
    "These differences turn into money, speed and fairness. A support team serving Hindi-speaking customers pays several times more per message with one tokenizer than another; a code assistant fills its context window faster than a chat assistant; and a model that sees `1234567` as `123`, `456`, `7` has to learn arithmetic across chunks that do not line up with place values. This step measures each effect on real counts and rebuilds the rules behind them.",
  ],
  worked: [
    {
      kind: "text",
      text: "The Languages view's six sample texts (one sentence in four languages, a line of code, and an arithmetic expression), counted with the real GPT-4 and GPT-4o tokenizers. The last two columns use GPT-4o: characters covered per token, and tokens relative to the English sentence.",
    },
    {
      kind: "table",
      caption: "Six texts, two real tokenizers",
      columns: ["text", "characters", "GPT-4 tokens", "GPT-4o tokens", "characters per GPT-4o token", "GPT-4o tokens vs English"],
      rows: [
        ["English", 52, 13, 12, 4.33, 1],
        ["Spanish", 50, 16, 12, 4.17, 1],
        ["Hindi", 42, 45, 14, 3, 1.17],
        ["Japanese", 24, 28, 17, 1.41, 1.42],
        ["Code", 48, 21, 21, 2.29, 1.75],
        ["Numbers", 33, 17, 17, 1.94, 1.42],
      ],
      source: "worked/playground.py",
    },
    {
      kind: "text",
      text: "GPT-4o's larger vocabulary cut Hindi from 45 tokens to 14 and Spanish from 16 to 12, but code and numbers did not change at all. Japanese packs fewer characters per token (1.41) because each Japanese character carries more meaning than a Latin letter; comparing tokens for the same sentence, as the last column does, is the fair measure. Now look inside the numbers:",
    },
    {
      kind: "table",
      caption: "How GPT-4o cuts numbers and one word",
      columns: ["text", "pieces", "token count"],
      rows: [
        ["'1234567'", "123 | 456 | 7", 3],
        ["'2026'", "202 | 6", 2],
        ["'3.14159'", "3 | . | 141 | 59", 4],
        ["'strawberry'", "st | raw | berry", 3],
        ["' strawberry'", " strawberry", 1],
        ["'STRAWBERRY'", "ST | RAW | B | ERRY", 4],
      ],
      source: "worked/playground.py",
    },
  ],
  concept: [
    {
      heading: "The token tax",
      paragraphs: [
        "A tokenizer spends its vocabulary where its training text was dense. Text in languages that were rare in that collection is split into shorter pieces, so the same meaning costs more tokens. Researchers have measured differences of several times between languages for the same content, and called it a source of unfairness: speakers of those languages pay more per request, wait longer for answers, and fit less of their text into the context window.",
        "The size of the tax is a property of the tokenizer, not the language. With GPT-4's tokenizer our Hindi sentence costs 3.5 times as many tokens as the English one (45 vs 13); with GPT-4o's it costs 1.17 times (14 vs 12). Doubling the vocabulary and rebalancing the training text toward more languages removed most of the gap for this sentence. When you choose a model for users who do not write in English, measure the token counts of their real text with each candidate's tokenizer.",
        "A fair measurement needs parallel text: the same messages in each language, ideally real ones from your users translated by people rather than made up. Count tokens for each version with each candidate tokenizer, divide by the English count, and multiply by the price per token to get a cost per message for every language you support. A few hundred messages per language is enough to see the pattern; single sentences, like the ones here, only illustrate it.",
      ],
      formula: {
        expr: "token tax(language) = tokens(text in language) / tokens(same text in English), same tokenizer",
        symbols: [
          { sym: "tokens(…)", meaning: "count from the real tokenizer of the model you will call" },
          { sym: "same text", meaning: "the same meaning, translated; comparing different content tells you nothing" },
        ],
        example: "GPT-4: Hindi 45 / English 13 = 3.46.   GPT-4o: 14 / 12 = 1.17.",
      },
    },
    {
      heading: "Pre-tokenization: the rules before BPE",
      paragraphs: [
        "Before BPE runs, GPT-style tokenizers cut text into chunks with a regular expression, and merges never cross chunk boundaries. The pattern separates letters, digits, punctuation and whitespace, attaches a single leading space to the word after it (that is why tokens look like ` cat`), and splits English contractions such as `'m` and `'s` off the word. Part 3 builds a simplified version; the real patterns are longer, and GPT-2's also keeps the last space of a run attached to the next word, but the idea is the same.",
        "Pre-tokenization explains many \"why is this split here?\" questions. A word and its punctuation can never become one token. A word at the start of a text (no leading space) is a different token from the same word mid-sentence, which is why `strawberry` is three pieces but ` strawberry` is one. Changing the case changes the letters, so `STRAWBERRY` falls back to pieces learned from much rarer upper-case text.",
      ],
      mistake: "Assuming the same word is always the same token. Position (leading space or not), case and surrounding punctuation all change the pieces, so test with the real text you will send, not with a word on its own.",
    },
    {
      heading: "Numbers",
      paragraphs: [
        "GPT-4, GPT-4o and Llama 3 cut every run of digits into chunks of at most three, counted from the left: `1234567` is `123`, `456`, `7`. This keeps the number of numeric tokens small (there are only 1,110 possible chunks of one to three digits) and stops the vocabulary filling up with specific long numbers. Older choices differ: GPT-2 had no rule and learned arbitrary numeric pieces, while Llama 1 and 2 split numbers into single digits.",
        "Counting from the left means chunks do not line up with place value. `1000` is `100` + `0` but `10000` is `100` + `00`, so the digit in the thousands place sits in a different chunk depending on the length of the number. To add two numbers the model has to work out which chunks correspond, something a person aligning digits on paper never has to think about. This is one reason models make arithmetic mistakes that look silly, and why tools such as a calculator or code execution (Module 10) are the reliable route for exact arithmetic.",
      ],
      formula: {
        expr: "digit chunks = re.findall(r\"\\d{1,3}\", digit run), taken from the left",
        symbols: [
          { sym: "\\d{1,3}", meaning: "one to three digits; the regex takes as many as it can, left to right" },
        ],
        example: "3.14159 → 3 | . | 141 | 59: the fractional part is chunked from its own left end.",
      },
    },
    {
      heading: "Code and whitespace",
      paragraphs: [
        "Code mixes short identifiers, operators, brackets and indentation, so it tokenizes densely: our one line of JavaScript, 48 characters, takes 21 tokens with either tokenizer, about 2.3 characters per token against 4.3 for English prose. Newer tokenizers include entries for runs of spaces so that indentation does not cost one token per space, and common keywords (` return`, ` function`) are single tokens.",
        "For a code assistant this means the context window fills two or more times faster than the same number of characters of prose, and that long files need chunking sooner. Minified code, long hexadecimal strings and base64 blobs are worse still, since nothing in them matches learned pieces. Counting with the real tokenizer before you send a file is the only reliable estimate.",
      ],
    },
  ],
  guided:
    "In the Playground, paste a paragraph of an email, then a block of code, then a long number, and predict which costs the most tokens per character. Switch to **Languages** and check which language gains most from GPT-4o, then type a sentence in a language you know.",
  build: {
    id: "m02-playground",
    title: "Measure real tokenizers and rebuild their rules",
    packages: [],
    data: "tokens",
    parts: [
      part("playground", "p1", "From real GPT-4 and GPT-4o counts, compute how much each kind of text saves with the larger vocabulary, and find the biggest winner.", [
        "`100 * (row[\"cl100k_base\"] - row[\"o200k_base\"]) / row[\"cl100k_base\"]`.",
        "`biggest_saving` is already written: it uses your `saving_pct` as the key.",
      ]),
      part("playground", "p2", "Rebuild GPT-4o's number rule with one regular expression, check it against the real pieces, and see why chunks don't align with place value.", [
        "`re.findall(pattern, text)` returns every match in order.",
        "`r\"\\d{1,3}|\\D\"`: up to three digits, or any single non-digit.",
      ]),
      part("playground", "p3", "Write a simplified GPT-style pre-tokenizer: words keep their leading space, digits come in chunks of three, nothing is lost.", [
        "The pattern is given; `re.findall(PATTERN, text)` is the whole function.",
        "Check the output by joining it: `\"\".join(pieces) == text`.",
      ]),
    ],
  },
  local: [],
  checks: [
    {
      id: "m02-play-tax",
      prompt: "You are choosing between two models for a Hindi-language support bot. What should you compare first, besides answer quality?",
      options: [
        "Their vocabulary sizes",
        "Token counts of real Hindi support messages with each model's own tokenizer",
        "The number of layers",
        "Their English benchmark scores",
      ],
      correctIndex: 1,
      explanation: "The token tax depends on the tokenizer: our Hindi sentence is 45 tokens with GPT-4's and 14 with GPT-4o's. That ratio feeds directly into cost, speed and how much fits in the context window.",
    },
    {
      id: "m02-play-numbers",
      prompt: "Why can multi-digit arithmetic be awkward for a model whose tokenizer chunks digits in threes from the left?",
      options: [
        "Numbers are always unknown tokens",
        "The chunks do not line up with place value, so the same digit position falls in different tokens for numbers of different lengths",
        "The model cannot see digits at all",
        "Numbers are removed during pre-tokenization",
      ],
      correctIndex: 1,
      explanation: "`1000` is `100 0` but `10000` is `100 00`: the model has to work out the alignment that a person gets for free by writing digits in columns.",
    },
  ],
  oneSentence:
    "Real tokenizers cut text by pre-tokenization rules and learned merges, so cost per character varies widely: other languages pay a token tax that depends on the tokenizer, code is dense, and numbers are chunked in threes from the left, out of step with place value.",
  deeper: [
    {
      label: "Petrov et al. 2023, tokenizer unfairness",
      url: "https://arxiv.org/abs/2305.15425",
      adds: "Measured token-count differences across many languages and tokenizers, and what they mean for cost and latency.",
    },
    {
      label: "OpenAI tiktoken",
      url: "https://github.com/openai/tiktoken",
      adds: "The tokenizers used here; the source includes each encoding's pre-tokenization pattern.",
    },
    {
      label: "Touvron et al. 2023, LLaMA (section 2)",
      url: "https://arxiv.org/abs/2302.13971",
      adds: "A different number rule: LLaMA's tokenizer splits all numbers into individual digits.",
    },
  ],
};
