# Design: Tokenization topic (LLM curriculum, Stage 1)

Date: 2026-11-24 · Status: draft for approval

## Intent

The project owner is learning LLMs from scratch through a curriculum of stages. Stage 1, "Text-to-Number
Foundations", has three topics: Tokenization, Token Embeddings and Positional Encoding. This design covers
**Tokenization**, the first topic, and the platform changes needed to host a curriculum.

Goal for the learner: start from plain-language analogies and illustrations, and by the end be able to
answer *anything* about tokenization. That includes interview-style questions ("how does BPE training
work?"), practical ones ("why is my prompt so expensive?", "how do I chunk documents for RAG?") and
quirky ones ("why can't the model count the r's in *strawberry*?").

## Goals

- One deep, self-contained lesson (about 14 steps) that goes from layman to expert, each step with an
  interactive visual.
- Real algorithms, not mock-ups: a working BPE trainer you can step through, WordPiece greedy matching,
  Unigram/SentencePiece segmentation, and the **real GPT-4o / GPT-4 tokenizers** on any text you type.
- Real-world examples throughout: cost, context windows, languages, code, numbers, chat templates, RAG.
- A challenge set (about 15 scenario questions with hints) that checks mastery, not recall.
- A platform that can hold the whole curriculum: topics grouped by stage in the navigation.

## Non-goals (for now)

- Embeddings and Positional Encoding topics (next, built with the same pattern).
- Sandbox mode, Auto-Play speed selector, custom notes, parameter-tuning challenges (from CLAUDE.md;
  revisit later).
- Training a production-quality tokenizer in the browser; the trainer works on small corpora for teaching.
- Exact current API prices (they change); cost uses an editable example price.

## Anti-goals

- Hand-wavy or wrong explanations. Every number shown is computed by real code or labelled as an example.
- A wall of text. Each step has at most ~3 short paragraphs; the visual carries the idea.
- Jargon before intuition. Every step opens with an everyday analogy, then the precise version.

## Constraints

- Existing stack: React 19 + Vite + TypeScript strict, Tailwind, lucide-react, framer-motion, Vitest.
- Works offline once loaded (the learner may use it from another PC on the LAN). Tokenizer vocabularies
  are bundled, lazy-loaded only on the steps that use them (~2–4 MB, off the initial bundle).
- Existing verification bar: `npm run typecheck`, `npm run test` (including the console-error smoke test),
  `npm run build`, plus a headless-browser pass.

## Approaches considered

- **A. One subject per topic, grouped by stage (chosen by the owner).** Tokenization is a full subject
  with its own lesson and quiz; the navigation groups subjects under "Stage 1 · Text-to-Number
  Foundations". Gives each topic the depth asked for; needs `category`/`difficulty`/`estimatedMinutes`
  metadata and a grouped subject menu.
- **B. One subject per stage.** All three Stage 1 topics in one ~30-step lesson. Simpler navigation, but
  overlong lessons and a quiz spread across three topics. Not chosen.

## Platform changes

1. **Remove the three existing subjects** (`transformers`, `distributed-systems`, `data-lakehouse`) and
   their registry entries; the owner chose to start fresh and to delete them permanently (no backup
   commit). Engine, template and `create-subject` stay.
   Tests that referenced them are rewritten against the registry generically (any subject, any count ≥ 1).
2. **Curriculum metadata** on `SubjectModule` (from CLAUDE.md): `category` (stage label, e.g.
   `"Stage 1 · Text-to-Number Foundations"`), `difficulty` (`beginner | intermediate | advanced`),
   `estimatedMinutes`. Template and scaffolding script updated to include them.
3. **Grouped subject menu** in `TopNav`: a dropdown listing subjects under their stage headings with
   progress per topic. Replaces the flat tabs, which won't scale to a curriculum.
4. **Step `keyTakeaway`**: optional one-line "remember this" callout shown at the bottom of the narrative
   (CLAUDE.md's `keyTakeaway`). Existing `summary` stays as the subtitle.
5. **Challenge `hint`**: optional hint the learner can reveal before answering (CLAUDE.md asks for hints).
6. **CLAUDE.md**: only the parts that would become wrong are updated (subject list in the directory tree;
   note the actual field names). Everything else is left as written.

## The Tokenization lesson

Each step: analogy first, then the precise idea, then a "Try it" on the stage. Stage views listed per step.

| # | Step | Layman hook | Interactive stage |
|---|------|-------------|-------------------|
| 1 | Why models need numbers | A calculator can't read; text must become numbers | Sentence → pieces → ID numbers, animated |
| 2 | Three ways to chop text | LEGO: single studs vs custom-moulded pieces vs standard bricks | Same text split by characters / words / subwords, with counts and an out-of-vocabulary word |
| 3 | The vocabulary | A phrasebook: every entry has a number | Vocab-size slider: sequence length vs embedding-table size trade-off; real vocab sizes (GPT-2 50k, GPT-4 100k, GPT-4o 200k, Llama 3 128k, BERT 30k) |
| 4 | BPE: learning the pieces | Texting shorthand: frequent pairs get their own symbol | Step-through BPE trainer on a small editable corpus: pair counts, merge chosen, vocab grows |
| 5 | BPE: tokenizing new words | Spelling an unfamiliar word with known chunks | Apply learned merges, in order, to a new word you type |
| 6 | Bytes: never an unknown token | Everything is ultimately bytes | UTF-8 bytes of `é`, `你`, `🤖`; byte-level fallback; the `Ġ` space marker |
| 7 | WordPiece (BERT) | Longest dictionary match first | Real `bert-base-uncased` vocabulary (30,522 entries): greedy longest-match with `##` continuations and whole-word `[UNK]` |
| 8 | SentencePiece & Unigram | Languages without spaces; picking the most likely split | `▁` space marker; several segmentations ranked by probability (Viterbi) |
| 9 | Special tokens | Punctuation for the machine: start, end, separators | Chat message rendered as the Llama 3 template (`<|begin_of_text|>`, `<|start_header_id|>`, `<|eot_id|>`), BERT `[CLS]`/`[SEP]`/`[PAD]`/`[MASK]` with real ids, GPT `<|endoftext|>`; why users must not inject them |
| 10 | Real tokenizer playground | See exactly what GPT sees | Real GPT-4o (`o200k_base`) and GPT-4 (`cl100k_base`) side by side: coloured tokens, IDs, counts, chars per token |
| 11 | Languages, code and numbers | The "token tax" | Same sentence in English, Spanish, Hindi, Japanese, plus code and numbers, with real token counts |
| 12 | Quirks and failure modes | Why models trip on letters and digits | *strawberry*, leading spaces, capitalisation, number splitting, reversing text, glitch tokens |
| 13 | Tokens in practice | Tokens are the unit of cost, limits and chunking | Calculator: text → tokens → cost (editable price) → fits the context window? Token-based chunking for RAG with overlap |
| 14 | Cheat sheet | Everything on one card | Reference card: terms, algorithms compared, numbers to remember, common interview questions |

### Algorithms (pure, unit-tested `model.ts` modules)

- **BPE trainer**: word frequencies → repeated "count adjacent pairs, merge the most frequent", with
  deterministic tie-breaking; records every merge for the step-through. Encoder applies merges by rank.
- **WordPiece encoder**: BERT's basic pre-tokenizer (lower-case, strip accents, split on whitespace and
  punctuation), then greedy longest-match-first with `##` prefixes and whole-word `[UNK]`, over the real
  `bert-base-uncased` vocab.txt (Apache-2.0, ~230 KB, lazy-loaded).
- **Unigram segmenter**: Viterbi best segmentation and top-k alternatives over a small vocabulary with
  log-probabilities.
- **UTF-8 bytes**: via `TextEncoder`.
- **Real tokenizers**: `js-tiktoken` with `o200k_base` and `cl100k_base` ranks, dynamically imported.

### Challenges (~15, scenario-based, each with hint, explanation and link to its step)

Cover: why subwords; BPE training mechanics; encoding with merges; byte fallback; WordPiece `##`;
SentencePiece for languages without spaces; special-token injection; cost estimation; non-English token
tax; strawberry; number arithmetic; leading spaces; vocab-size trade-off; RAG chunking by tokens;
`max_tokens` and context window.

## Fact-check and sources (approved addition)

Before the lesson copy is written, every specific claim is checked against primary sources rather than
memory: vocabulary sizes, algorithm details (BPE merge rule, WordPiece scoring, Unigram pruning), byte-level
markers, special-token and chat-template formats, and named quirks. Sources: Sennrich et al. 2016 (BPE),
Kudo 2018 and Kudo & Richardson 2018 (Unigram, SentencePiece), Schuster & Nakajima 2012 and Devlin et al.
2019 (WordPiece, BERT), Radford et al. 2019 (GPT-2 byte-level BPE), OpenAI's tiktoken repository, Hugging
Face tokenizers docs/course, and model cards. Where possible, numbers are verified by running the real
tokenizers instead of quoting. Findings are recorded in `docs/research/tokenization-sources.md`, and the
cheat-sheet step ends with a **Further reading** list linking these sources.

## Testing

- Unit tests for each algorithm (known BPE merges on the classic `low/lower/newest/widest` corpus,
  WordPiece splits, Viterbi best path, byte counts, real-tokenizer known counts such as `"hello world"`).
- Registry validation, App shell and smoke tests rewritten to be subject-agnostic; the smoke test walks
  every step and control of Tokenization with zero console errors.
- Headless-browser pass over the built app.

## Left to the builder

Exact copy, colours, the example corpus and vocabularies, layout of each visual, and the precise
challenge wording, within the goals above.
