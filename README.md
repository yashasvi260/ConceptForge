# ConceptForge

An interactive, visual learning platform for technical concepts. Each **subject** is a guided lesson
(explanation on the left, live interactive stage on the right) plus a challenge quiz. Subjects plug
into a shared engine, so adding a new one doesn't touch the player.

The content is organised as a curriculum of **stages**, each made of **topics**:

| Stage | Topic | What you can play with |
| --- | --- | --- |
| 1 · Text-to-Number Foundations | **Tokenization** (14 steps, 16-question challenge) | Real GPT-4o / GPT-4 tokenizers in the browser, a step-through BPE trainer on Sennrich et al.'s example, real BERT WordPiece, SentencePiece/Unigram segmentation, UTF-8 bytes, chat-template special tokens and injection, the multilingual "token tax", strawberry/number quirks, cost, context windows and RAG chunking |
| 1 · Text-to-Number Foundations | Token Embeddings | *next* |
| 1 · Text-to-Number Foundations | Positional Encoding | *next* |

Every specific fact in a lesson is checked against primary sources or computed by running the real
tokenizers; see `docs/research/`. Nothing is sent to any API: the GPT vocabularies come from OpenAI's
open-source tiktoken project (via `js-tiktoken`) and run locally.

## Running it

Requires Node 22 (e.g. via [nvm](https://github.com/nvm-sh/nvm): `nvm install 22`).

```bash
npm ci                 # install dependencies
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
(`#/tokenization/4`, `#/tokenization/challenge`) deep-links to any step.

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
    tokenization/     algorithms (bpe, wordpiece, unigram, bytes, real tokenizers) + tests,
                      views/ (one per step), steps.ts, challenges.ts, data/ (BERT vocab)
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
