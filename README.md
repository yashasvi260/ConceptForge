# ConceptForge

An interactive, visual learning platform for technical concepts. Each **subject** is a guided lesson
(explanation on the left, live interactive stage on the right) plus a challenge quiz. Subjects plug
into a shared engine, so adding a new one doesn't touch the player.

Content follows the **LLM Mastery** track (`docs/curriculum.md`, v2): 4 parts, 18 modules. Every module shows
where it fits in the whole LLM picture, what it builds on and what comes next. Unbuilt modules appear in the
menu as "coming soon".

| Part | Module | Status / what you can play with |
| --- | --- | --- |
| I · Understanding Language Models | **01 Introduction to Language Models** | **Deep lessons**: 12 long-form steps (why → worked example → concept with the live view → **Build it** in Python in the page → check → one sentence), ending in a mini-project that builds a tiny language model end to end. Covers the LLM loop, anatomy, exact parameter counts (GPT-2, Llama 3 8B, GPT-3), training vs using, Bag-of-Words, real MiniLM embeddings, context, the three families, cross-attention, representation vs generative, pre-training vs fine-tuning |
| | **02 Tokens and Embeddings** | **Deep lessons**: 14 long-form steps (merged from 20; steps with two views get a view switcher). Tokens: three ways to chop text, the vocabulary and its cost, BPE training and encoding (checked against the page's own trainer), bytes and UTF-8, WordPiece on a slice of BERT's real vocabulary, SentencePiece/Unigram with Viterbi, special tokens and Llama 3's chat template, real GPT-4/GPT-4o counts, cost and context limits. Embeddings: the lookup table, real MiniLM contextual vectors, mean pooling that reproduces MiniLM exactly, and a mini-project: semantic search evaluated with hit@k and MRR |
| | **03 Inside the Transformer Block** | Sinusoidal vs RoPE, Q/K/V and √d, attention arcs + heatmap + causal mask, multi-head, GQA, LayerNorm/RMSNorm, GELU/SwiGLU, logits, decoding, KV cache |
| | 04 How LLMs Generate · 05 How Models Learn | coming soon (Module 03's decoding and KV cache steps move to 04 when it is built) |
| II · Using Pretrained Language Models | **06 Text Classification** | 60 bank tickets: a classifier head trained live on MiniLM vectors, zero-shot with editable label descriptions, gemma4 by prompting (recorded, with real token probabilities); 3-way comparator |
| | **07 Clustering & Topics** | 78 comments: real UMAP (umap-js) → HDBSCAN (tested against scikit-learn) → c-TF-IDF keywords → topic names recorded from gemma4; sliders and add-your-own |
| | **08 Prompt Engineering** | 16 prompt combinations × 8 tickets × 4 samples, recorded from gemma4:12b and qwen2.5-coder:1.5b: builder, probability inspector, chaining |
| | 09 Semantic Search & RAG · 10 Agents & Tools · 11 Multimodal | coming soon |
| III · Training and Fine-Tuning | 12–15 (embeddings, encoders, generation, reasoning & distillation) | coming soon |
| IV · Production, Guardrails & Capstone | 16 Serving · 17 Evals & Guardrails · 18 Capstone | coming soon |

**Real models, in your browser, for free.** Embedding steps run **all-MiniLM-L6-v2** (Apache-2.0, ~23 MB, served by
this site and cached after the first load) through transformers.js; tokenizer steps run OpenAI's open-source
GPT-4o/GPT-4 vocabularies (js-tiktoken) and BERT's real vocabulary. Nothing is sent to any API. Where a full
generative model would be needed (attention patterns, next-token logits), the lesson says "illustrative".

**Generated text is recorded, never written by hand.** Part II's LLM outputs were produced by real models through a
local [Ollama](https://ollama.com) (`scripts/record-generations.mjs`, jobs in `scripts/recordings/`) and are shown
with their model, temperature and date. If you run Ollama yourself, **Connect my Ollama** (on any generative panel)
runs your own prompts live. The site never contacts Ollama until you click it; if the browser blocks the call, start
Ollama with `OLLAMA_ORIGINS` set to the site's origin (e.g. `https://yashasvi260.github.io`).
Every specific fact is checked against primary sources; see `docs/research/`.

**Deep lessons: understand it, then build it (Modules 01 and 02).** A step with a `deep` field renders as a
split page: the six-section reading scrolls on the left, and a practice panel stays in view on the right with two
tabs, **Interactive** (the step's live view) and **Build it · Python**. Prompts in the reading open the right tab;
on a phone the panel sits under the reading. Its **Build it** exercise is real Python, run in the page by [Pyodide](https://pyodide.org)
(`314.0.7`, loaded from jsDelivr on the first press of Run, about 10 MB, in a Web Worker with a 10-second limit per
run). The learner edits starter code with `TODO`s; private checks (which learner code cannot overwrite) say pass or
fail; hints and the solution are a click away. Three rules keep it honest, and tests enforce all three:

- every exercise's **solution passes** its checks and its **starter does not** (`deep/deep.test.ts` runs them in
  Pyodide under Node);
- every worked-example table equals what its script in `deep/worked/` prints;
- every **Run it locally** listing (PyTorch, transformers, sentence-transformers, Ollama) shows the output of a real
  run: `OLLAMA_URL=http://<host>:11434 node scripts/capture-local-outputs.mjs [--module 02]` reruns them in Docker
  (`python:3.12-slim`, pinned packages) and the test fails if a listing's code changed without a new capture.

`src/core/deep.ts` enforces the depth standard (why 150–450 words, concept 700–1,700, a common mistake, 2–3 checks,
1–3 https sources). Content coverage is tracked in `docs/research/module01-coverage.md`.

## Running it

Requires Node 22 (e.g. via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22`).

```bash
npm ci                 # install dependencies (the model files are in the repo; `npm run fetch-model` re-downloads them)
npm run dev            # dev server → http://localhost:5173 (also reachable from your LAN)
npm run typecheck
npm run test
npm run build          # production build → dist/
npm run preview        # serve the production build
```

**No Node on the host?** `scripts/docker-npm.sh` runs any npm/node command in `node:22-alpine`
(e.g. `scripts/docker-npm.sh npm run test`), and `docker compose up` starts the dev server.

**Keyboard:** `←` / `→` step through a lesson, `Space` toggles Auto-Play (7 s per step).
The home page (`#/`) is the course overview: how much of the syllabus is complete, a Resume button, and every
Part and module with its status. A module counts as complete when every step has been viewed and its
practice check attempted. The ☰ button opens the syllabus from anywhere; each module ends with an
"Up next in syllabus" card.
Progress (last step, visited steps, best practice score) is stored in `localStorage`, and the URL hash
(`#/03-transformer-internals/4`, `#/02-tokens-embeddings/quiz`) deep-links to any step; old `#/tokenization/...`
and `…/challenge` links still work.

## Deployment

Live site: **https://yashasvi260.github.io/ConceptForge/**

Every push to `master` runs `.github/workflows/deploy.yml`: `npm ci`, typecheck, tests, then a build with
`BASE_PATH=/ConceptForge/` (the repo sub-path GitHub Pages serves from), published with GitHub Pages.
A failing check stops the deploy. Local `npm run dev` / `build` keep the default base `/`.

## Project layout

```
src/
  core/
    types.ts          SubjectModule, LessonStep, StageProps, ChallengeItem
    registry.ts       the list of subjects + validateSubject()
    storage.ts        localStorage progress (guarded, sanitised)
    route.ts          URL hash ⇄ course page / subject/step/mode
    courseProgress.ts module status, course completion, resume target
    useKeyboardShortcuts.ts
  components/         AppHeader, CourseOverview, SyllabusDrawer, UpNextCard, StepControls, SplitWorkspace, ChallengeRunner, ui
  subjects/
    _template/        starter copied by the create-subject script
    01-intro-llms/ … one folder per built module: logic (+ tests), views/, steps.ts, challenges.ts
    02-tokens-embeddings/   tokenizers (bpe, wordpiece, unigram, real GPT) + embedding views, data/ (BERT vocab)
    03-transformer-internals/  positional, attention, norms, ffn, sampling, kvcache maths + views
    06-text-classification/    tickets, classifier head, zero-shot, recorded gemma4 answers
    07-clustering-topics/      UMAP wrapper, HDBSCAN, c-TF-IDF, precomputed default layout
    08-prompt-engineering/     prompt builder (buildPrompt.mjs shared with the recording job), scoring, 2 recorded experiments
  llm/                recording format, Ollama client, "Connect my Ollama" live mode, GenerationPanel
  ml/                 MiniLM embedding engine (transformers.js), useEmbeddings, vector maths
  core/track.ts       the 18-module curriculum (v2), parts, legacy-id redirects
  smoke.test.tsx      every subject × step × control × challenge, failing on any console error
scripts/
  create-subject.mjs  scaffold a new subject
  record-generations.mjs  record real model outputs from Ollama (OLLAMA_URL=http://<host>:11434)
  make-embedding-fixtures.mjs  real MiniLM vectors for test texts or a dataset (--dataset)
  make-hdbscan-fixture.py  scikit-learn reference labels (run in a python Docker container)
  docker-npm.sh       run npm/node in Docker
```

## Adding a subject

```bash
node scripts/create-subject.mjs linear-algebra "Linear Algebra" --short "Lin Alg" --register
```

This copies `src/subjects/_template/` to `src/subjects/linear-algebra/` with the id and titles filled in;
`--register` also adds it to `src/core/registry.ts` (without it, the script prints the two lines to add).
Then:

1. Set `category` (the curriculum stage), `difficulty` and `estimatedMinutes` in `index.ts`.
2. Put the logic behind your visuals in pure modules, and unit-test them.
3. Write the steps in `steps.ts` (with `tryIt` and `keyTakeaway`). Each step's `view` key tells your Stage what to draw.
4. Build the visual in `Stage.tsx`. Keep shared state there: the Stage stays mounted across steps.
5. Add `challenges.ts` questions with a `hint`, linked to a step via `relatedStepId`. Answer order is shuffled at runtime.

`src/core/registry.test.ts` validates every registered subject, and the smoke test automatically walks through
the new subject's steps, controls and challenges, failing on any console error.
