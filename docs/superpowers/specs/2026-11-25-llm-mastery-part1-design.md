# Design: LLM Mastery track — player restructure + Part I (Modules 01–03)

Date: 2026-11-25 · Status: draft for approval · Curriculum: `docs/curriculum.md`

## Intent

The owner is learning LLMs end to end and wants the pieces to connect: "it would be a waste just learning the
concepts and not understanding how to connect the dots". The curriculum (`docs/curriculum.md`) defines an
**LLM Mastery** track: 4 Parts, 14 Modules. Module 01 is the root "what is an LLM" introduction; every later
module plugs into that picture. This milestone restructures the player around Parts/Modules and builds Part I.
Parts II, III and IV get their own designs afterwards, in that order.

## Goals

- Navigation shows the whole track: Part I–IV with Modules 01–14, built ones playable, unbuilt ones visible
  as "coming soon", so the learner always sees the full map.
- Every module **connects the dots**: a "where this fits" map with this module highlighted, an opening step
  that says what it builds on, and a closing step that hands off to the next module.
- Part I fully built, each module with left-pane narrative (intuition, formula/metric callout), right-pane live
  visualizer with controls, and practice questions (curriculum asks 2–3; we keep more where useful).
- Real numbers where they matter: a real sentence-embedding model (all-MiniLM-L6-v2) running in the browser
  for embeddings and cosine similarity (owner chose option A).
- Still free and hostable on GitHub Pages; verified with typecheck, tests and `npm run build`.

## Non-goals (this milestone)

- Modules 04–14 content (only their placeholders in the map).
- Running a generative LLM in the browser. Where generation matters (next-token probabilities), we use
  clearly labelled illustrative logits.
- Sandbox mode, notes, speed selector (still deferred from CLAUDE.md).

## Anti-goals

- Isolated lessons: a module that doesn't say where it sits and what comes next fails the brief.
- Invented numbers presented as real. Every number is computed by real code (tokenizers, MiniLM, exact maths)
  or labelled "illustrative".
- Facts from memory: claims are checked against primary sources, as for Tokenization
  (`docs/research/`).

## Constraints

- Existing stack and conventions (React 19, Vite, TS strict, Tailwind, framer-motion, Vitest, TDD).
- Free and static: GitHub Pages, ≤ 1 GB site, 100 GB/month soft bandwidth. The model is self-hosted in the
  site (~23 MB quantized ONNX + tokenizer/config files), lazy-loaded only on steps that use it, then cached.
- Must work offline after first load; no API keys, no server.

## Approaches considered (owner's choices)

- **Realism: A. real small model in the browser (chosen)** vs B. precomputed results only vs C. simulated
  maths. A gives genuine similarities on any typed text and becomes the thread through Modules 02, 04, 05,
  08 and 10; it costs a one-time ~23 MB download per visitor.
- **Model hosting:** self-host in the Pages site (chosen, builder's call) vs load from the Hugging Face CDN.
  Self-hosting avoids depending on another site; switching to the CDN later is a one-line change.
- **Tokenization's place:** it becomes the first section of Module 02 "Tokens and Embeddings", followed by
  a new Embeddings section (builder's proposal, accepted in conversation without objection).

## Platform changes

1. **Track model.** `SubjectModule` gains `part: 1 | 2 | 3 | 4`, `moduleNumber: number` and
   `bridge: { buildsOn: string; leadsTo: string }` (one-line plain-language links). `category` becomes the
   Part title. A static `TRACK` list (`src/core/track.ts`) holds all 14 modules' number, id, title and part
   from the curriculum, so unbuilt modules appear as "coming soon".
2. **Module selector.** TopNav's menu lists Parts I–IV with numbered modules; built ones are selectable with
   progress, unbuilt ones are greyed with "coming soon".
3. **"Where this fits" map.** A compact strip of the LLM journey (Text → Tokens → Embeddings → Transformer
   → Output, then Use, Train, Serve) shown on every module's first step and in the left pane header,
   highlighting the current module.
4. **Bridge steps.** Every module starts with a "Builds on" note and ends with an "Up next" card linking to
   the next module (or "coming soon").
5. **Step sections.** `LessonStep.section?: string`; the step scrubber groups dots by section and shows the
   section name (needed for Module 02's Tokens / Embeddings halves).
6. **Formula/metric callout.** `LessonStep.callout?: string` (curriculum's "formula/metric callout"),
   shown in the left pane in monospace (e.g. `softmax(QKᵀ/√d)·V`).
7. **Embedding engine.** `src/ml/embeddings.ts`: lazy-load `@huggingface/transformers` with the self-hosted
   `Xenova/all-MiniLM-L6-v2` quantized model; `embedSentences(texts)` → normalized 384-d vectors (mean
   pooling) and `embedTokens(text)` → per-token contextual vectors with their tokens; `cosine(a, b)`. A React
   hook with loading/error/retry states, like `useRealTokenizer`.

## Module 01 — Introduction to Language Models (`01-intro-llms`)

The root of the track. About 9 steps:
1. What an LLM is, in one picture: text in, next token out, repeated. The whole-track map with Parts I–IV.
2. Representing language as numbers: **Bag-of-Words** sparse counts (real counting on typed text).
3. **Dense embeddings**: the same sentences as MiniLM vectors. Real comparison: BoW cosine vs embedding
   cosine for paraphrases ("the film was great" / "the movie was excellent").
4. The attention idea in one sentence (context changes meaning), pointing ahead to Module 03.
5. **Architecture comparator**: Bag-of-Words vs Encoder (bidirectional, BERT) vs Decoder (causal, GPT/Llama),
   a toggle showing which tokens each position may see, and the output type (counts / representation /
   next token).
6. **Encoder–Decoder** (T5-style): flow diagram, and when each family is used.
7. Representation vs Generative models: interactive flow of the same input through each.
8. **Pre-training vs fine-tuning**: timeline of the two stages and what each produces.
9. Up next: how text becomes tokens and vectors (Module 02).
Practice: 4+ questions.

## Module 02 — Tokens and Embeddings (`02-tokens-embeddings`)

- **Section "Tokens"**: the existing 14 Tokenization steps (moved from `src/subjects/tokenization/`),
  minus its standalone cheat sheet, plus the curriculum's playground presets (English, code, numbers,
  multilingual) added to the Playground step.
- **Section "Embeddings"** (new, about 6 steps): the embedding lookup table (token id → row of numbers);
  static vs contextual embeddings; the **Contextual Embedding Shift Visualizer** (`bank` in "The bank
  approved the loan" vs "The river bank flooded": real per-token MiniLM vectors and cosine similarity);
  sentence/document embeddings by pooling; cosine similarity explorer (type sentences, see a real similarity
  matrix); semantic search preview pointing to Module 08.
- Combined cheat sheet at the end (tokens + embeddings) and "Up next: Module 03".
- Practice: the existing 19 tokenization questions plus 4+ embedding questions.

## Module 03 — Looking Inside Large Language Models (`03-transformer-internals`)

About 12 steps:
1. The forward pass map: tokens → embeddings + position → N × [attention → FFN] → logits → next token.
2. **Positional information**: sinusoidal (wave heatmap) vs **RoPE** (rotation of vector pairs by position
   angle; the dot product depends only on relative distance, verified numerically).
3. **Q, K, V** projections and scaled dot product (`callout: softmax(QKᵀ/√d)·V`).
4. **Self-attention**: clickable tokens, live SVG attention arcs, N × N heatmap, head selector, causal mask
   toggle (illustrative hand-designed heads, labelled, as in the earlier transformer demo).
5. Multi-head attention.
6. **GQA**: query heads sharing K/V heads; KV-cache memory vs number of KV heads.
7. **Residual connections and RMSNorm/LayerNorm** (computed exactly on a vector).
8. **Feed-forward (GELU vs SwiGLU)**: activation curves and the expand–contract shape.
9. Output: logits → softmax over the vocabulary.
10. **Decoding**: greedy, temperature, top-k, top-p, with live probability bars (illustrative logits).
11. **KV cache ON vs OFF**: compute and memory comparison (exact counting formulas).
12. Up next: Part II, using these models (Module 04).
Practice: 6+ questions.

## Testing and verification

- TDD as before: pure modules (BoW, cosine, RoPE, RMSNorm, GELU/SwiGLU, sampling, KV/GQA maths) with unit
  tests; embedding engine tested against a real MiniLM run in Node (known similarity ordering, vector
  dimension 384, normalized).
- Registry/track tests: all 14 curriculum modules present in `TRACK`; built modules valid; bridges present.
- Smoke test walks every built module's steps, controls and quiz with no console errors; headless-browser
  pass over the build served from `/ConceptForge/`.
- Milestone gate: `npm run typecheck`, `npm run test`, `npm run build`, then push (deploys to Pages).
- Research notes: `docs/research/` gains files for Modules 01 and 03 (and embeddings for 02).

## Left to the builder

Copy, exact visual layouts, example sentences, the illustrative attention heads and logits, the precise
number of steps per module within the outlines above, and question wording.
