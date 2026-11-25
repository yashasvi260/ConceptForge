# ConceptForge

An interactive, visual learning platform for technical concepts. Each **subject** is a guided lesson
(explanation on the left, live interactive stage on the right) plus a challenge quiz. Subjects plug
into a shared engine, so adding a new one doesn't touch the player.

Content follows the **LLM Mastery** track (`docs/curriculum.md`): 4 parts, 14 modules. Every module shows
where it fits in the whole LLM picture, what it builds on and what comes next. Unbuilt modules appear in the
menu as "coming soon".

| Part | Module | Status / what you can play with |
| --- | --- | --- |
| I · Understanding Language Models | **01 Introduction to Language Models** | The LLM loop and track map; Bag-of-Words vs real embeddings; encoder/decoder/encoder-decoder visibility; pre-training (next-token, BERT masking) vs fine-tuning |
| | **02 Tokens and Embeddings** | Real GPT-4o/GPT-4 tokenizers, BPE trainer, real BERT WordPiece, SentencePiece, special tokens, token tax; embedding lookup, contextual "bank" shift, mean pooling, similarity matrix, semantic search |
| | **03 Looking Inside LLMs** | Sinusoidal vs RoPE, Q/K/V and √d, attention arcs + heatmap + causal mask, multi-head, GQA, LayerNorm/RMSNorm, GELU/SwiGLU, logits, decoding, KV cache |
| II · Using Pretrained Language Models | 04–09 | coming soon |
| III · Training and Fine-Tuning | 10–12 | coming soon |
| IV · Production Inference & Guardrails | 13–14 | coming soon |

**Real models, in your browser, for free.** Embedding steps run **all-MiniLM-L6-v2** (Apache-2.0, ~23 MB, served by
this site and cached after the first load) through transformers.js; tokenizer steps run OpenAI's open-source
GPT-4o/GPT-4 vocabularies (js-tiktoken) and BERT's real vocabulary. Nothing is sent to any API. Where a full
generative model would be needed (attention patterns, next-token logits), the lesson says "illustrative".
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
Progress (last step, visited steps, best challenge score) is stored in `localStorage`, and the URL hash
(`#/03-transformer-internals/4`, `#/02-tokens-embeddings/challenge`) deep-links to any step; old `#/tokenization/...` links redirect to Module 02.

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
    route.ts          URL hash ⇄ subject/step/mode
    useKeyboardShortcuts.ts
  components/         TopNav, StepControls, SplitWorkspace, ChallengeRunner, ui primitives
  subjects/
    _template/        starter copied by the create-subject script
    01-intro-llms/ … one folder per built module: logic (+ tests), views/, steps.ts, challenges.ts
    02-tokens-embeddings/   tokenizers (bpe, wordpiece, unigram, real GPT) + embedding views, data/ (BERT vocab)
    03-transformer-internals/  positional, attention, norms, ffn, sampling, kvcache maths + views
  ml/                 MiniLM embedding engine (transformers.js), useEmbeddings, vector maths
  core/track.ts       the 14-module curriculum, parts, legacy-id redirects
  smoke.test.tsx      every subject × step × control × challenge, failing on any console error
scripts/
  create-subject.mjs  scaffold a new subject
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
