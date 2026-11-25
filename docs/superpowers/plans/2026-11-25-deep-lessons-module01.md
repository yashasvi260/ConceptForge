# Deep Lessons: Module 01 Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn all 12 Module 01 steps into six-section lesson pages: Why, Worked example, Concept with the
interactive view, Build it with Python that runs in the page, Check, and In one sentence + Go deeper. Module 01 also
gets a mini-project, "Build a tiny language model end to end".

**Architecture:**
- `LessonStep` gains an optional `deep` field. When it is present, the player renders `DeepLessonPage` (one
  scrolling page) instead of `SplitWorkspace`. Steps without it render exactly as today.
- Python runs in a Web Worker with Pyodide, loaded from the jsDelivr CDN on the first press of Run.
- `harness.py` wraps the learner's code and the checks. The browser worker and the Node tests use the same harness,
  so the tests prove what the page will do.
- Exercise code lives in `.py` files, imported with `?raw`, so one source feeds the page, the tests and the
  local-capture script.

**Tech Stack:** React 19, TS strict, Tailwind 4 (cream and dark themes), Vitest, Pyodide 314.0.7 (Python 3.14,
NumPy 2.4.6), js-tiktoken (already installed), Docker `python:3.12-slim` for the "Run it locally" captures.

**Spec:** `docs/superpowers/specs/2026-11-25-deep-lessons-module01-design.md`

## Global Constraints

- **Six sections per deep step, in this order:**
  1. Why it exists (about 200–400 words).
  2. Worked example (every intermediate value written out).
  3. The concept (about 800–1,500 words in titled sub-parts, each formula with every symbol named and a small
     numeric case, at least one "common mistake").
  4. Build it.
  5. Check (2–3 understanding questions).
  6. In one sentence, plus Go deeper (1–3 primary-source links).
- **"Every 'expected output' shown on the page … is produced by actually running that code."** Same for every
  worked-example number.
- **"A check that passes on the untouched starter code is a bug."**
- **Unchanged:** the course shell, the Practice Check, module completion maths, saved progress, step links, ← →,
  phone layout, both themes, GitHub Pages.
- **Pyodide:**
  - pinned at `314.0.7`, CDN base `https://cdn.jsdelivr.net/pyodide/v314.0.7/full/`;
  - loaded only on the first Run;
  - status text `Loading Python (≈10 MB, first time only)`;
  - runs in a Web Worker;
  - per-run timeout of 10 s after Python is ready.
- **"Exercises passed" appears only** on the lesson page and as a small mark on the step bar.
- **Auto-Play is off** for deep steps, and Space is not intercepted on them.
- **Reference book:** coverage checklist only. Never copy its text, figures or code. `reference/` is git-ignored.
- **Plain English.** Every term defined at first use. Each exercise part is about 30 lines of code or fewer.
- **Shell and git:**
  - prefix every shell command with `source ~/.nvm/nvm.sh &&`;
  - commit with `git -c user.name="yash maheswarapu" -c user.email="44908122+yashasvi260@users.noreply.github.com"`;
  - every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
  - the Ollama URL comes from env `OLLAMA_URL`, never hard-coded.

## Review Focus

1. **Infinite loop in learner code** (`while True: pass`): after 10 s the page shows "Stopped after 10 s", the
   worker is replaced, and the next Run works. Test in Task 3.
2. **Syntax error or exception in learner code:** the error shows the line number in *their* code, with no harness
   frames. Test in Task 3.
3. **Learner code that redefines `check_*` names, deletes `DATA` or monkeypatches `print`:** the checks still run on
   the harness's own copy. Test in Task 3.
4. **CDN unreachable or offline:** a clear "Couldn't load Python. Check your connection." message with a Retry
   button. The rest of the page works. Test in Task 4.
5. **Learner leaves the step while a run is in flight:** the result never lands on the new step, and nothing updates
   after unmount. Test in Task 4.

---

### Task 1: Deep-lesson data model and validator

**Files:**
- Modify: `src/core/types.ts` (add types; `LessonStep.deep?: DeepLesson`)
- Create: `src/core/deep.ts`, `src/core/deep.test.ts`

**Interfaces:**
- **Produces, in `types.ts`:**

  ```ts
  type WorkedBlock =
    | { kind: "text"; text: string }
    | { kind: "math"; text: string }
    | { kind: "table"; caption: string; columns: string[]; rows: (string | number)[][]; source: string /* worked/*.py that prints these rows as JSON */ };
  interface Formula { expr: string; symbols: { sym: string; meaning: string }[]; example: string }
  interface ConceptPart { heading: string; paragraphs: string[]; formula?: Formula; mistake?: string }
  interface ExercisePart { id: string; prompt: string; starter: string; solution: string; checks: string; hints: string[] }
  interface Exercise { id: string; title: string; packages: "numpy"[]; data?: string /* key into DEEP_DATA */; parts: ExercisePart[] }
  interface LocalListing { id: string; title: string; install: string; code: string; output: string }
  interface SourceLink { label: string; url: string; adds: string }
  interface DeepLesson { why: string[]; worked: WorkedBlock[]; concept: ConceptPart[]; guided: string; build: Exercise; local: LocalListing[]; checks: ChallengeItem[]; oneSentence: string; deeper: SourceLink[] }
  ```

- **Produces, in `deep.ts`:**
  - `wordCount(paragraphs: string[]): number`
  - `validateDeep(d: DeepLesson): string[]`: returns problems; empty means OK.
  - `DEPTH = { why: [150, 450], concept: [700, 1700] } as const`

- [ ] **Step 1: Write failing tests in `deep.test.ts`.**
  - `wordCount(["a b", "c"]) === 3`.
  - Starting from a minimal valid fixture (built in the test), `validateDeep` returns problems containing each of
    these:
    - `"why: 40 words (want 150–450)"`
    - `"concept: … words"` (out of range)
    - `"concept: no common mistake"`
    - `"checks: 1 (want 2–3)"`
    - `"deeper: 0 (want 1–3)"`
    - `"deeper: not https"`
    - `"build: no parts"`
    - `"part p1: no checks"`
    - `"worked: no table"`
    - `"oneSentence: empty"`
  - Returns `[]` for the valid fixture.
- [ ] **Step 2:** Run `npx vitest run src/core/deep.test.ts`. Expected: FAIL, the module is not found.
- [ ] **Step 3:** Add the types and implement `deep.ts`. Concept words are counted over `paragraphs` and `mistake`.
- [ ] **Step 4:** Run the same command. Expected: PASS. Then `npm run typecheck`. Expected: no errors.
- [ ] **Step 5:** Commit: `feat(deep): lesson data model and depth validator`.

### Task 2: Coverage check against the reference book

**Files:**
- Create: `docs/research/module01-coverage.md`

- [ ] **Step 1:** Look for a file in `reference/`.
  - **If one exists:** read Chapter 1 and the parts of Chapters 2–3 that Module 01 previews (tokens, embeddings,
    attention at a high level). Write a table: **book topic → our step id / section → status (covered / gap)**.
    Topics and wording are paraphrased; nothing is quoted beyond chapter titles.
  - **If the folder is empty:** build the same table from primary sources:
    - GPT-2 paper;
    - *Attention Is All You Need*;
    - the Llama 3 paper (arXiv 2407.21783);
    - the BERT paper;
    - T5;
    - Kaplan et al. 2020.

    Write `Ruling: book absent — coverage from primary sources; re-run when the book arrives` in the ledger.
- [ ] **Step 2:** Every gap gets a row naming the step and concept part that will absorb it. Content Tasks 6–9 read
  this file.
- [ ] **Step 3:** Commit: `docs(research): Module 01 coverage checklist`.

### Task 3: Python harness and Pyodide runner core

**Files:**
- Create:
  - `src/py/harness.py`
  - `src/py/program.ts`
  - `src/py/runCore.ts`
  - `src/py/runCore.test.ts` (`// @vitest-environment node`)
- Modify: `package.json` (devDependency `pyodide` at exact `314.0.7`, also used as the worker's runtime dependency)

**Interfaces:**
- **Produces:**

  ```ts
  // program.ts
  export const PYODIDE_VERSION = "314.0.7";
  export const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
  export const TIMEOUT_MS = 10_000; export const MAX_OUTPUT = 20_000;
  export interface RunRequest { learnerCode: string; prelude: string /* earlier parts' solutions, joined */; checks: string; data: unknown; packages: "numpy"[] }
  export interface CheckResult { name: string; ok: boolean; message: string }
  export interface RunResult { status: "pass" | "fail" | "error" | "timeout" | "load-error"; stdout: string; checks: CheckResult[]; error: string | null }

  // runCore.ts (takes a loaded PyodideInterface; shared by the worker and the Node tests)
  export async function runInPyodide(py: PyodideInterface, req: RunRequest): Promise<RunResult>;
  ```

- **Harness rules (`harness.py`):**
  - `DATA` is injected into the learner namespace as a deep copy.
  - The prelude runs first, then the learner code is compiled as filename `"<your code>"`.
  - stdout is captured and capped at `MAX_OUTPUT`, with the marker `\n… output truncated`.
  - The checks module is executed in a **separate** namespace. Each function named `check_*` is called in source
    order with a **snapshot dict** of the learner namespace. `AssertionError` text becomes `message`; the check name
    is the function name without `check_`, with `_` replaced by spaces.
  - Exceptions in learner code keep only frames from `"<your code>"`, formatted as
    `line N: ExceptionType: message`.
  - Status: `"error"` when the learner code raised; `"pass"` when every check is ok; otherwise `"fail"`.
  - Zero checks counts as `"fail"`.

- [ ] **Step 1: Write failing tests.** They load Pyodide once in `beforeAll`, using `PYODIDE_CDN` as
  `packageBaseUrl`, with a 120 s hook timeout.
  - `x = 2` with check `def check_x_is_two(ns): assert ns["x"] == 2, "x should be 2"` → `pass`, and the check name
    is `"x is two"`.
  - `x = 3` → `fail`, message `"x should be 2"`.
  - `1/0` on line 2 → `error`, and `error` matches `/^line 2: ZeroDivisionError/`, with no `harness` text.
  - `def check_x_is_two(ns): return None` plus `x = 3` in learner code → still `fail` (Review Focus 3).
  - `del DATA` plus a check that reads the data from its own copy → the check still sees the data.
  - `print("a" * 50000)` → stdout length ≤ `MAX_OUTPUT + 30`, and ends with `output truncated`.
  - A NumPy request: `import numpy as np; v = np.ones(3)` with check `ns["v"].sum() == 3` → `pass`.
- [ ] **Step 2:** Run `npx vitest run src/py/runCore.test.ts`. Expected: FAIL, the module is not found.
- [ ] **Step 3:** Implement `harness.py` (imported `?raw` into `runCore.ts`), `program.ts` and `runCore.ts`. Data
  is passed via `py.globals.set` with `toPy`, packages via `py.loadPackage`, and the harness is called once per run.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5: Infinite-loop test (Review Focus 1).** Write a failing test for
  `runWithTimeout(spawn: () => Worker-like, req, ms): Promise<RunResult>` in `src/py/client.ts`, with
  `src/py/client.test.ts` (jsdom, fake worker). A worker that never answers within `ms` gives
  `{status:"timeout", error:"Stopped after 10 s: your code may loop forever."}`, the worker is terminated, and the
  next call spawns a new one. Implement it and watch it pass.
- [ ] **Step 6:** Commit: `feat(py): pyodide harness with private checks, error lines, output cap, timeout`.

### Task 4: Worker, runner client, and the CodeExercise component

**Files:**
- Create:
  - `src/py/py.worker.ts`
  - `src/py/PyRunnerContext.tsx`
  - `src/components/deep/CodeExercise.tsx`
  - `src/components/deep/CodeExercise.test.tsx`
- Modify: `src/py/client.ts`

**Interfaces:**
- **Consumes:** `RunRequest`, `RunResult`, `runInPyodide`, `runWithTimeout`.
- **Produces:**
  - `type RunFn = (req: RunRequest, onStatus: (s: "loading" | "running") => void) => Promise<RunResult>`
  - `createWorkerRunner(): RunFn`
  - `PyRunnerProvider({ run?: RunFn, children })` and `usePyRunner(): RunFn`
  - `CodeExercise({ exercise, data, onPartPassed: (partId) => void, passedParts: string[] })`
- **Worker:** imports `loadPyodide` from `"pyodide"` with `indexURL: PYODIDE_CDN`. Loading failure posts
  `{status:"load-error", error:"Couldn't load Python. Check your connection."}`.

- [ ] **Step 1: Write failing component tests** with a fake `RunFn` passed through `PyRunnerProvider`.
  - Shows each part's `prompt`, a textarea holding `starter` (label `"Code for part <n>"`), and buttons Run, Reset,
    Hint, Show solution.
  - Run while the fake reports `"loading"` shows `Loading Python (≈10 MB, first time only)`.
  - A `pass` result lists the checks with ✓ and calls `onPartPassed("p1")`.
  - A `fail` result shows ✗ and the message.
  - An `error` result shows the error text in a `role="alert"`.
  - A `load-error` result shows the message and a **Retry** button (Review Focus 4).
  - Hint reveals `hints[0]`, then `hints[1]`, then is disabled.
  - Show solution asks "Show the solution? Try a hint first." and on confirm replaces the code.
  - Reset restores `starter`.
  - Editing the code and remounting keeps the edit (localStorage key
    `conceptforge:code:v1:<exerciseId>/<partId>`, read and written in try/catch).
  - Unmounting before the fake resolves gives no React act warning, and nothing is shown after remount
    (Review Focus 5: guard with a mounted ref plus a request id).
  - Part 2's request has `prelude` equal to part 1's `solution`. The page shows the note "Earlier parts run with the
    reference solution."
- [ ] **Step 2:** Run `npx vitest run src/components/deep/CodeExercise.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement. The textarea uses `font-mono`, `spellCheck={false}`, and inserts 4 spaces on Tab. The
  results list has `aria-live="polite"`.
- [ ] **Step 4:** Run the same command. Expected: PASS. Then `npm run typecheck`.
- [ ] **Step 5:** Commit: `feat(deep): CodeExercise with worker runner, hints, solution, drafts`.

### Task 5: DeepLessonPage, exercise progress, and wiring into the player

**Files:**
- Create:
  - `src/core/exerciseProgress.ts` and `.test.ts`
  - `src/components/deep/DeepLessonPage.tsx`
  - `WorkedExample.tsx`
  - `ConceptSection.tsx`
  - `LocalListingView.tsx`
  - `InlineChecks.tsx`
  - `GoDeeper.tsx`
  - `DeepLessonPage.test.tsx`
- Modify:
  - `src/App.tsx`: render `DeepLessonPage` when `step.deep`; Auto-Play off and its button hidden for deep steps.
  - `src/core/useKeyboardShortcuts.ts`: add `spaceEnabled: boolean` to the handlers. When false, Space is left to
    the browser.
  - `src/components/StepControls.tsx`: optional `passedSteps?: string[]`, rendered as a small ✓ on the segment with
    `data-passed`.

**Interfaces:**
- **Produces:**
  - `EXERCISE_KEY = "conceptforge:exercises:v1"`
  - `loadExerciseProgress(): Record<string, string[]>`
  - `markPartPassed(exerciseId, partId): Record<string, string[]>`
  - `isExercisePassed(ex: Exercise, prog): boolean`
  - `DeepLessonPage({ subject, step, stepIndex, total, isBuilt, onOpenModule, footer, children /* the Stage */ })`
- **Page layout:** a single column, max-width about 860px. Section headings, in order:
  - "1 · Why it exists"
  - "2 · Worked example"
  - "3 · The concept"
  - "4 · Build it"
  - "5 · Check"
  - "6 · In one sentence"

  The Stage renders inside section 3, after the first concept part, at full width, with `deep.guided` above it as
  the "Try it" box.
- **Formulas:** each one renders as `expr`, then a symbol table, then "Example:" and `example`.
- **Mistakes:** rendered as a callout labelled "Common mistake".
- **Local listings:** each shows `install`, then `code`, then "Output (captured from a real run)". There is a Copy
  button for the code.
- **Inline checks:** reuse the `ChallengeItem` shape, each with its own Check button and explanation. They do not
  touch the Practice Check score.

- [ ] **Step 1: Write failing tests.**
  - `exerciseProgress`: corrupt storage → `{}`; marking a part twice is stored once.
  - `DeepLessonPage`: all six headings in order; the formula symbol table renders; "Common mistake" renders;
    choosing the right option in an inline check shows its explanation; the Copy button calls
    `navigator.clipboard.writeText` with the code.
  - `App`: visiting a deep step does not render `"Interactive stage"` side-by-side, and there is no Auto-Play
    button. A non-deep step (Module 02) still renders `SplitWorkspace` and Auto-Play.
  - Space on a deep step is not `preventDefault`ed.
  - A passed exercise shows `data-passed` on its segment.
- [ ] **Step 2:** Run `npx vitest run src/core/exerciseProgress.test.ts src/components/deep src/components/StepControls.test.tsx src/App.test.tsx`
  (create `App.test.tsx` if none exists). Expected: FAIL.
- [ ] **Step 3:** Implement. Wrap `App` in `PyRunnerProvider` (no `run` prop means `createWorkerRunner()`, created
  lazily on first use).
- [ ] **Step 4:** Run the same command. Expected: PASS. Then run the full suite with `npm run test`. Expected: all
  pass; the count rises from 362.
- [ ] **Step 5:** Commit: `feat(deep): deep lesson page, exercise progress, player wiring`.

### Tasks 6–9: Module 01 content (three steps per task, then the mini-project)

**Files, per step `<id>`:**
- `src/subjects/01-intro-llms/deep/<id>.ts`: exports a `DeepLesson`.
- `src/subjects/01-intro-llms/deep/py/<id>/{p1.starter,p1.solution,p1.checks}.py` (plus `p2…` for multi-part
  exercises).
- `src/subjects/01-intro-llms/deep/worked/<id>.py`: prints the worked tables as JSON.
- **Modify:** `steps.ts` (attach `deep`), `challenges.ts` (unchanged unless coverage adds a question).

**Shared test** (created in Task 6, extended in each task): `src/subjects/01-intro-llms/deep/deep.test.ts`, with
`// @vitest-environment node`. For every Module 01 step that has `deep`:
- `validateDeep(deep)` is `[]`.
- Every exercise part: the **solution** passes, so `status === "pass"`, with a prelude of the earlier solutions.
- The **starter** does not pass, so `status !== "pass"`.
- Every `worked` table equals the JSON printed by running its `source` file in Pyodide.
- Every `local` listing's `output` equals the captured entry in `deep/local-outputs.json` (Task 10), whose `code`
  matches the listing's `code` byte for byte.

**Per step:** content follows `module01-coverage.md`, keeps the step's existing `view` and summary, and replaces
the short `body` with `deep`. The old `body` stays as the summary paragraph.

**Data:** `src/subjects/01-intro-llms/deep/data.ts` exports `DEEP_DATA`. It is built by
`node scripts/make-embedding-fixtures.mjs --deep-out src/subjects/01-intro-llms/deep/data/minilm.json`, a new mode
that writes the existing `SENTENCES` and the `"bank"` token vectors (4 decimals).

| Task | Steps | Pinned values the checks use |
|---|---|---|
| 6 | `big-picture`, `anatomy`, `how-large` | **`anatomy` worked example:** GPT-2 token IDs for `"The cat sat"` are `[464, 3797, 3332]`; the test asserts them with `js-tiktoken` `gpt2`. **`how-large`:** the checks assert `param_count(GPT2_SMALL) == 124_439_808`, `param_count(LLAMA3_8B) == 8_030_261_248`, and fp16 bytes `== 2 * params`. The configs are passed in `DATA`, copied from `modelConfigs.ts`. |
| 7 | `train-vs-use`, `bag-of-words`, `dense-embeddings` | **`train-vs-use`:** `train_flops(8.03e9, 15e12) ≈ 7.2e23` (rel 1e-2); `infer_flops_per_token(8.03e9) ≈ 1.6e10`; one gradient step changes `w` and a forward pass doesn't. **`dense`:** the nearest neighbour of `"The film was great"` is `"The movie was excellent"`, using the MiniLM vectors in `DATA`. |
| 8 | `context`, `architectures`, `encoder-decoder` | **`context`:** cosine between `"bank"` in the two river sentences > cosine between `"bank"` in river and money sentences, using real token vectors. **`architectures`:** the causal mask is lower-triangular, with softmax rows summing to 1 and position 0 attending only to itself. **`encoder-decoder`:** cross-attention output shape `(T_dec, d)`. |
| 9 | `representation-vs-generative`, `pretraining-finetuning`, `recap` (mini-project, 4 parts: `tokenize`, `train_bigrams`, `generate`, `fine_tune`) | **`fine_tune`:** after fine-tuning on the banking text, `P("loan" \| "the")` rises; the exact before and after values are printed by the solution and asserted in the checks. |

For each task:

- [ ] **Step 1:** Write the step's checks `.py` files and add the step to the shared test's list. Run
  `npx vitest run src/subjects/01-intro-llms/deep`. Expected: FAIL (no `deep` yet, or the starter or solution is
  missing).
- [ ] **Step 2:** Write the starter and solution, then the worked script and the `DeepLesson` content to the depth
  standard. Every number in the prose comes from the worked script or from `research/part1-sources.md`.
- [ ] **Step 3:** Run the same command. Expected: PASS, with `validateDeep` returning `[]` for each new step.
- [ ] **Step 4:** Run `npm run test` and `npm run typecheck`. Expected: all pass.
- [ ] **Step 5:** Commit: `feat(01-deep): <steps> as deep lessons`.

Listings that need Task 10's outputs are added in Task 10, not here, so Tasks 6–9 have `local: []` where needed.

### Task 10: "Run it locally" listings with captured outputs

**Files:**
- Create:
  - `scripts/local-listings/01/{dense,context,encdec,repgen}.py`
  - `scripts/capture-local-outputs.mjs`
  - `src/subjects/01-intro-llms/deep/local-outputs.json`
- Modify: the `deep/` files of those four steps (add `local` entries whose `code` is `?raw` of the same `.py`).

**Interfaces:**
- **Produces:** `local-outputs.json` = `{ [id]: { code, output, ranAt, image: "python:3.12-slim", packages: Record<string,string> } }`.

- [ ] **Step 1:** Add the four steps' listings to the shared test, which asserts that captured `output` exists and
  `code` matches. Run it. Expected: FAIL.
- [ ] **Step 2: Write the listings and the capture script.** The script runs each `.py` file in Docker
  `python:3.12-slim` with exact pinned pip versions: `sentence-transformers`, `transformers`, `torch` CPU wheel. The
  `install` line shown on the page is that exact pip line.
  - `dense`: sentence-transformers `all-MiniLM-L6-v2`, cosine values.
  - `context`: `transformers` `AutoModel` hidden state for `"bank"`.
  - `encdec`: `t5-small` translation.
  - `repgen`: embedding plus Ollama `/api/generate` with `gemma4:12b`, `think:false`, `options.num_ctx:32768`,
    `temperature:0`, against `OLLAMA_URL`. The code reads `os.environ.get("OLLAMA_URL", "http://localhost:11434")`
    so the copy-paste default works for learners.
- [ ] **Step 3:** Run `OLLAMA_URL=http://<gateway>:11434 node scripts/capture-local-outputs.mjs`. Expected: four
  entries written. Then run the shared test. Expected: PASS.
- [ ] **Step 4:** Commit: `feat(01-deep): run-it-locally listings with captured real outputs`.

### Task 11: Docs, browser pass, size check

**Files:**
- Modify:
  - `README.md` (deep-lesson format, exercise runner, how to re-capture outputs)
  - `CLAUDE.md` (the deep-lesson rules: depth standard, starter-must-fail, outputs-must-be-run)
  - `docs/research/part1-sources.md` (new sources)

- [ ] **Step 1:** Run `npm run typecheck && npm run test && BASE_PATH=/ConceptForge/ npm run build`. Expected: all
  green. The main bundle stays within about 10 KB gz of 205 KB. Pyodide is not in `dist` (it comes from the CDN).
- [ ] **Step 2: Headless pass** with Playwright Docker `v1.55.0-noble` against `vite preview`, covering every Module
  01 step in cream and dark at 1280 and 390 px wide:
  - the six headings are present;
  - there is no horizontal scroll;
  - on `how-large`, the real solution is pasted and Run gives all ✓ (a real Pyodide run over the network);
  - the starter gives ✗;
  - `while True: pass` gives the timeout message within 12 s, and a following Run works;
  - console errors: 0.
- [ ] **Step 3:** Commit: `docs: deep-lesson format and runner`.

## Execution note

Tasks 1, 3, 4, 5 and 10 share interfaces. Tasks 6–9 are content-heavy and independent of each other once Task 5 is
done.
