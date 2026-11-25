# ConceptForge

An interactive, visual learning platform for technical concepts. Each **subject** is a guided lesson
(explanation on the left, live interactive stage on the right) plus a challenge quiz. Subjects plug
into a shared engine, so adding a new one doesn't touch the player.

Content follows the **LLM Mastery** track (`docs/curriculum.md`): 4 parts, 14 modules. Every module shows
where it fits in the whole LLM picture, what it builds on and what comes next. Unbuilt modules appear in the
menu as "coming soon".

| Part | Module | Status / what you can play with |
| --- | --- | --- |
| I · Understanding Language Models | **01 Introduction to Language Models** | The LLM loop and track map; anatomy of an LLM; what "large" means (exact parameter counts of GPT-2, Llama 3 8B, GPT-3); training vs using; Bag-of-Words vs real embeddings; encoder/decoder/encoder-decoder visibility; pre-training (next-token, BERT masking) vs fine-tuning |
| | **02 Tokens and Embeddings** | Real GPT-4o/GPT-4 tokenizers, BPE trainer, real BERT WordPiece, SentencePiece, special tokens, token tax; embedding lookup, contextual "bank" shift, mean pooling, similarity matrix, semantic search |
| | **03 Looking Inside LLMs** | Sinusoidal vs RoPE, Q/K/V and √d, attention arcs + heatmap + causal mask, multi-head, GQA, LayerNorm/RMSNorm, GELU/SwiGLU, logits, decoding, KV cache |
| II · Using Pretrained Language Models | **04 Text Classification** | 60 bank tickets: a classifier head trained live on MiniLM vectors, zero-shot with editable label descriptions, gemma4 by prompting (recorded, with real token probabilities); 3-way comparator |
| | **05 Clustering & Topics** | 78 comments: real UMAP (umap-js) → HDBSCAN (tested against scikit-learn) → c-TF-IDF keywords → topic names recorded from gemma4; sliders and add-your-own |
| | **06 Prompt Engineering** | 16 prompt combinations × 8 tickets × 4 samples, recorded from gemma4:12b and qwen2.5-coder:1.5b: builder, probability inspector, chaining |
| | 07–09 | coming soon |
| III · Training and Fine-Tuning | 10–12 | coming soon |
| IV · Production Inference & Guardrails | 13–14 | coming soon |

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
    04-text-classification/    tickets, classifier head, zero-shot, recorded gemma4 answers
    05-clustering-topics/      UMAP wrapper, HDBSCAN, c-TF-IDF, precomputed default layout
    06-prompt-engineering/     prompt builder (buildPrompt.mjs shared with the recording job), scoring, 2 recorded experiments
  llm/                recording format, Ollama client, "Connect my Ollama" live mode, GenerationPanel
  ml/                 MiniLM embedding engine (transformers.js), useEmbeddings, vector maths
  core/track.ts       the 14-module curriculum, parts, legacy-id redirects
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
