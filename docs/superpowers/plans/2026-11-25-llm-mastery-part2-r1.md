# LLM Mastery Part II · Release 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Module 01's three "anatomy" steps and Modules 04 (classification), 05 (clustering & topics) and 06
(prompt engineering), with real computation in the browser and real gemma4 outputs recorded from the owner's Ollama,
plus an opt-in "Connect my Ollama" live mode.

**Architecture:** A shared `src/llm/` layer holds the recording format, a small Ollama client and the live-mode
context/components. A node script records generations into JSON fixtures per module. Each module follows the existing
pattern (`index.ts`, `steps.ts`, `challenges.ts`, `Stage.tsx`, `views/`, pure logic files with tests, `data/`).
Embeddings for fixed datasets are precomputed with real MiniLM (node) and shipped as JSON; learner-typed text is
embedded live.

**Tech Stack:** React 19, TS strict, Tailwind 4, Vitest, `@huggingface/transformers` (MiniLM), js-tiktoken,
`umap-js` 1.4.0 (new, MIT), Ollama HTTP API (recording + live mode).

**Spec:** `docs/superpowers/specs/2026-11-25-llm-mastery-part2-design.md`

## Global Constraints

- Every generated text is a recording from a real model, labelled `recorded from <model> · temperature <t> · <date>`, or produced live; never hand-written outputs.
- The site never contacts Ollama until the learner clicks "Connect my Ollama"; default endpoint `http://localhost:11434`, editable, remembered in `localStorage` (`conceptforge:ollama:v1`).
- Recording: `gemma4:12b`, `think: false`, `num_ctx: 32768` for every call; `logprobs: true, top_logprobs: 5` where probabilities are shown. Ollama URL from env `OLLAMA_URL` (no hard-coded host).
- Generative panels use fixed example inputs; sliders feeding them snap to recorded values; unrecorded state → "No recording for this setting" + live option, never a nearby recording.
- Real numbers or labelled: classifier training, zero-shot cosine, UMAP, HDBSCAN, c-TF-IDF, token counts and metrics are computed; cost figures are labelled estimates with their assumption shown.
- Facts and configs checked against primary sources in `docs/research/part2-sources.md`.
- Pages limits: no file > 100 MB in git; fixtures kept small (vectors rounded to 4 decimals).
- Commands need `source ~/.nvm/nvm.sh &&`. Branch `part2-r1`; merge and push only with the owner's OK.
- Cream theme: new colours via Tailwind classes or `var(--color-…)`, never hard-coded hex.

## Review Focus

1. Live mode on the Pages site with no Ollama running (or blocked by CORS) — the panel must show a clear message and keep showing the recording (Task 1 test `connect failure keeps recordings and explains OLLAMA_ORIGINS`).
2. Learner input the recordings don't cover (a new ticket in 04, an added document in 05, a toggle combination edit in 06) — "No recording for this setting", not a stale or nearby output (Task 1 test `missing recording shows the no-recording note`, plus module view tests).
3. Degenerate clustering input — `min_cluster_size` larger than the number of points, or all points identical — no crash; everything is noise or one cluster (Task 6 tests).
4. Model output that isn't valid JSON in Module 06 — scored as invalid, shown verbatim, never crashes the view (Task 8 test `invalid JSON scores as invalid`).
5. The classifier trained on a learner-edited label set (e.g. a label with no examples) — training still runs and the view explains the empty class (Task 4 test `class with no examples`).

---

### Task 1: Recording format and live Ollama layer

**Files:**
- Create: `src/llm/recordings.ts`, `src/llm/ollama.ts`, `src/llm/OllamaContext.tsx`, `src/llm/ConnectOllama.tsx`, `src/llm/GenerationPanel.tsx`
- Test: `src/llm/recordings.test.ts`, `src/llm/ollama.test.ts`, `src/llm/live.test.tsx`
- Modify: `src/App.tsx` (wrap in `OllamaProvider`)

**Interfaces:**
- Produces:
  - `interface TokenProb { token: string; logprob: number; top: { token: string; logprob: number }[] }`
  - `interface RecordedGeneration { key: string; system?: string; prompt: string; output: string; tokens?: TokenProb[]; toolCalls?: { name: string; arguments: Record<string, unknown> }[]; durationMs: number; evalCount: number }`
  - `interface RecordingFile { model: string; ollamaVersion: string; recordedAt: string; options: Record<string, unknown>; items: RecordedGeneration[] }`
  - `findRecording(file: RecordingFile, key: string): RecordedGeneration | undefined`; `recordingLabel(file): string` → `"recorded from gemma4:12b · temperature 0 · 2026-11-25"`
  - `isRecordingFile(x: unknown): x is RecordingFile` (shape check used by tests over every fixture)
  - `createOllamaClient(baseUrl: string, fetchFn?: typeof fetch): OllamaClient` with `version(): Promise<string>`, `generate(req: GenerateRequest): Promise<RecordedGeneration>` (`GenerateRequest = { model: string; prompt: string; system?: string; format?: unknown; temperature?: number; logprobs?: boolean; key?: string }`; always sends `think: false`, `num_ctx: 32768`), `chat(req: ChatRequest): Promise<ChatResult>` (messages + tools → `{ content, toolCalls }`)
  - `OllamaProvider`, `useOllama(): { status: "off" | "connecting" | "connected" | "error"; endpoint: string; setEndpoint(s): void; connect(): Promise<void>; disconnect(): void; client: OllamaClient | null; error: string | null }`
  - `ConnectOllama()` — button "Connect my Ollama"; endpoint field; on error shows help naming `OLLAMA_ORIGINS` and the site origin
  - `GenerationPanel({ file, recording, live?: { request: GenerateRequest } })` — recorded output with `recordingLabel`, or "No recording for this setting"; when connected, a "Run live" button that shows the live output labelled `live from <model>`

- [ ] **Step 1: Failing tests**
  - `recordings.test.ts`: `findRecording` by key; `recordingLabel` format; `isRecordingFile` accepts a valid sample and rejects missing `items`; **`every committed recording fixture is valid`** (glob `src/subjects/*/data/recordings/*.json` via `import.meta.glob`, eager).
  - `ollama.test.ts` (fake `fetch`): `generate sends think false and num_ctx 32768`; `maps logprobs to TokenProb`; `chat returns tool calls`; `non-200 throws with status`.
  - `live.test.tsx`: **`never calls fetch before Connect is clicked`** (render a `GenerationPanel` inside the provider, spy on `fetch`, assert 0 calls); `connect success shows Run live`; **`connect failure keeps recordings and explains OLLAMA_ORIGINS`**; **`missing recording shows the no-recording note`**; endpoint persisted to `conceptforge:ollama:v1`.
- [ ] **Step 2: Run** `npx vitest run src/llm` — Expected: FAIL (modules missing)
- [ ] **Step 3: Implement** per Interfaces; wrap `App` content in `OllamaProvider`
- [ ] **Step 4: Run** `npx vitest run src/llm && npm run typecheck` — Expected: PASS
- [ ] **Step 5: Commit** `feat(llm): recording format, Ollama client and opt-in live mode`

### Task 2: Recording and embedding scripts

**Files:**
- Create: `scripts/record-generations.mjs`, `scripts/recordings/README.md`
- Modify: `scripts/make-embedding-fixtures.mjs` (add `--dataset <json> --out <json>` mode)
- Test: `scripts/record-generations.test.ts` (node env)

**Interfaces:**
- Produces: `node scripts/record-generations.mjs <job-file.mjs>` where a job file default-exports `{ out: string; model: string; options: object; jobs: { key; system?; prompt; format?; temperature?; logprobs?; tools?; messages? }[] }`; writes a `RecordingFile` (Task 1 shape) to `out`; skips keys already recorded unless `--force`; `OLLAMA_URL` env (default `http://localhost:11434`); prints progress.
- Exports for test: `toRecordedGeneration(job, ollamaResponse, durationMs): RecordedGeneration`.
- Embedding mode: `node scripts/make-embedding-fixtures.mjs --dataset path.json --field text --out path.json` → `{ model: "Xenova/all-MiniLM-L6-v2", vectors: number[][] }` rounded to 4 decimals, in dataset order.

- [ ] **Step 1: Failing test** `toRecordedGeneration maps output, logprobs and timing` (sample Ollama response JSON with `logprobs` array as returned by Ollama 0.40.18)
- [ ] **Step 2: Run** `npx vitest run scripts/record-generations.test.ts` — Expected: FAIL
- [ ] **Step 3: Implement** script; first live check: `OLLAMA_URL=http://<windows-host-ip>:11434 node scripts/record-generations.mjs <tiny smoke job>` records 1 item with `think: false` and non-empty `output` (confirms gemma4 answers directly when thinking is off)
- [ ] **Step 4: Run** the test — Expected: PASS
- [ ] **Step 5: Commit** `feat(scripts): record generations from Ollama; dataset embedding fixtures`

### Task 3: Module 01 — anatomy, scale, training vs using

**Files:**
- Create: `src/subjects/01-intro-llms/modelConfigs.ts` (+ test), `views/AnatomyView.tsx`, `views/ScaleView.tsx`, `views/TrainUseView.tsx`
- Modify: `src/subjects/01-intro-llms/steps.ts` (3 steps after `big-picture`), `Stage.tsx`, `challenges.ts` (+2 questions), `views.test.tsx`
- Create: `docs/research/part2-sources.md` (start; Module 01 section)

**Interfaces:**
- Produces: `interface ModelConfig { id; name; family: "gpt2" | "llama"; vocab; dModel; layers; heads; kvHeads; ffn; context; trainingTokens?: number; tiedEmbeddings: boolean; source: string }`; `MODEL_CONFIGS: ModelConfig[]` (at least GPT-2 small, Llama 3 8B, plus one larger published config); `paramBreakdown(c): { embedding: number; layers: number; head: number; total: number }`.
- Step ids: `anatomy` (view `anatomy`), `how-large` (view `scale`), `train-vs-use` (view `trainuse`).

- [ ] **Step 1: Failing tests**: `GPT-2 small has exactly 124,439,808 parameters` (tied embeddings, learned positions); `Llama 3 8B has exactly 8,030,261,248 parameters` (GQA 8 KV heads, ffn 14336, untied head); `layers hold most parameters in Llama 3 8B`; view tests: anatomy parts clickable and each names its module; scale slider switches configs and shows the breakdown; `module 01 has the three new steps after big-picture`.
- [ ] **Step 2: Run** `npx vitest run src/subjects/01-intro-llms` — Expected: FAIL
- [ ] **Step 3: Implement**; verify every config value against the source recorded in `part2-sources.md` (paper / official config.json / model card)
- [ ] **Step 4: Run** same — Expected: PASS
- [ ] **Step 5: Commit** `feat(01): anatomy of an LLM, what "large" means, training vs using`

### Task 4: Module 04 logic and data

**Files:**
- Create: `src/subjects/04-text-classification/data/tickets.json` (~60 tickets: `{ id, text, label, split: "train" | "test" }`, labels `card`, `transfer`, `fraud`, `account`, `loan`, ≥ 2 test tickets per label), `data/ticket-embeddings.json` (Task 2 embedding mode), `classifier.ts` (+ test), `zeroShot.ts` (+ test), `cost.ts` (+ test)

**Interfaces:**
- Produces:
  - `trainSoftmax(X: number[][], y: number[], classes: number, opts: { epochs: number; lr: number; l2?: number }): { W: number[][]; b: number[]; lossHistory: number[] }` (full-batch gradient descent, zero init, deterministic)
  - `predictProba(model, x: number[]): number[]`; `accuracy(...)`; `confusionMatrix(trueLabels: number[], predLabels: number[], classes: number): number[][]`
  - `zeroShot(ticketVec: Float32Array, labelVecs: Float32Array[]): { scores: number[]; probs: number[] }` (cosine, softmax with temperature 0.05 for display — documented)
  - `estimateCost(tokens: number, pricePerMillion: number): number`
- [ ] **Step 1: Failing tests**: `learns a linearly separable toy set to 100%`; `loss decreases`; `confusion matrix counts`; **`class with no examples`** (training runs; that class never predicted; no NaN); `zero-shot ranks the nearest label first`; `cost estimate`; `ticket embeddings match tickets` (lengths equal, 384-d).
- [ ] **Step 2: Run** `npx vitest run src/subjects/04-text-classification` — Expected: FAIL
- [ ] **Step 3: Implement**; generate `ticket-embeddings.json` with the script
- [ ] **Step 4: Run** same — Expected: PASS; also real-data check (node test): head trained on train split reaches ≥ 80% test accuracy — record the actual number
- [ ] **Step 5: Commit** `feat(04): ticket dataset, classifier head, zero-shot, cost estimate`

### Task 5: Module 04 lesson

**Files:**
- Create: `src/subjects/04-text-classification/{index.ts,steps.ts,challenges.ts,Stage.tsx}`, `views/*.tsx`, `views.test.tsx`, `data/recordings/classify.json`, `scripts/recordings/04-classify.mjs`
- Modify: `src/core/registry.ts` (register), `src/test/fixtures` (if UI tests need real vectors)

**Interfaces:**
- Consumes: Tasks 1, 2, 4.
- Recording job: one item per test ticket, key `classify:<ticketId>`, temperature 0, `logprobs: true`, prompt template stored in `tickets.json` (`promptTemplate`) so live mode reuses it.
- Generative confidence = `exp(logprob)` of the first output token when it starts a valid label, else "unparsed".
- Steps (~9): why classify (bridge from Part I); task heads on representation models; embeddings + trained head (live training, loss curve, confusion matrix; label: "frozen MiniLM + trained head; full fine-tuning in Module 11"); zero-shot with label descriptions (editable); generative classification by prompting (recorded); confidence and calibration; 3-way comparator (accuracy on the test split, latency, cost estimate); choosing in production; up next.
- [ ] **Step 1: Failing view tests**: comparator shows three verdicts for a test ticket; generative verdict labelled with `recordingLabel`; typing a new ticket → head and zero-shot verdicts update, generative panel shows "No recording for this setting"; editing a label description re-runs zero-shot; subject validates in registry; smoke test covers it automatically.
- [ ] **Step 2: Run** `npx vitest run src/subjects/04-text-classification` — Expected: FAIL
- [ ] **Step 3: Implement**; run the recording job against the owner's Ollama; commit the fixture
- [ ] **Step 4: Run** `npx vitest run src/subjects/04-text-classification src/llm src/smoke.test.tsx` — Expected: PASS
- [ ] **Step 5: Commit** `feat(04): text classification module`

### Task 6: Module 05 logic and data

**Files:**
- Create: `src/subjects/05-clustering-topics/data/docs.json` (~80 short banking customer comments over ~6 themes), `data/doc-embeddings.json`, `umap.ts`, `hdbscan.ts`, `ctfidf.ts`, `random.ts` (+ tests)
- Modify: `package.json` (`umap-js` 1.4.0)

**Interfaces:**
- Produces:
  - `mulberry32(seed: number): () => number`
  - `project2d(vectors: number[][], opts: { nNeighbors: number; minDist: number; seed: number }): [number, number][]` (umap-js with seeded `random`)
  - `hdbscan(points: number[][], opts: { minClusterSize: number; minSamples?: number }): { labels: number[]; outlierScores: number[] }` (Campello et al. 2013: core distances, mutual-reachability MST, condensed tree, excess-of-mass selection; GLOSH outlier scores; label −1 = noise)
  - `cTfIdf(docsByCluster: string[][], topN: number): { cluster: number; words: { word: string; score: number }[] }[]` (BERTopic: `tf(t,c) · log(1 + A / f(t))`, A = average words per cluster; stop-words removed)
- [ ] **Step 1: Failing tests**: `same seed gives the same layout`; `hdbscan finds two well-separated blobs and marks a far point as noise`; **`minClusterSize larger than the data → all noise`**; **`identical points → one cluster, no NaN`**; `outlier score highest for the far point`; `hdbscan matches scikit-learn on a fixed dataset` (expected labels produced once by `scripts/make-hdbscan-fixture.py` with scikit-learn's `HDBSCAN`, committed; if Python/scikit-learn is unavailable, record a Ruling and keep the structural tests); `c-TF-IDF ranks a cluster's distinctive word first` (hand-computed example); `doc embeddings match docs`.
- [ ] **Step 2: Run** `npx vitest run src/subjects/05-clustering-topics` — Expected: FAIL
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** same — Expected: PASS
- [ ] **Step 5: Commit** `feat(05): documents, UMAP, HDBSCAN, c-TF-IDF`

### Task 7: Module 05 lesson

**Files:**
- Create: `src/subjects/05-clustering-topics/{index.ts,steps.ts,challenges.ts,Stage.tsx}`, `views/*.tsx`, `views.test.tsx`, `data/recordings/topics.json`, `scripts/recordings/05-topics.mjs`
- Modify: `src/core/registry.ts`

**Interfaces:**
- Consumes: Tasks 1, 2, 6.
- Recording: topic name per cluster for the **default** settings only, key `topic:<sorted doc ids joined>`; any other clustering → "No recording for this setting" (keywords from c-TF-IDF still shown live).
- Steps (~9): bridge from 04 (no labels this time); documents → embeddings; why reduce dimensions; UMAP 2-D scatter; density clustering intuition; HDBSCAN with `min_cluster_size` and outlier-threshold sliders (labels update live); c-TF-IDF keywords; LLM topic names (recorded); BERTopic pipeline recap + up next.
- [ ] **Step 1: Failing view tests**: scatter renders one point per doc; moving `min_cluster_size` changes the cluster count shown; outlier slider changes how many points are grey; adding a document embeds it and re-runs the pipeline, topic-name panel shows no-recording note; default clustering shows recorded names with label.
- [ ] **Step 2: Run** `npx vitest run src/subjects/05-clustering-topics` — Expected: FAIL
- [ ] **Step 3: Implement**; record topic names; commit fixture
- [ ] **Step 4: Run** same + smoke — Expected: PASS
- [ ] **Step 5: Commit** `feat(05): clustering and topic modeling module`

### Task 8: Module 06 experiment logic and recording

**Files:**
- Create: `src/subjects/06-prompt-engineering/data/task.json` (extraction task: 8 test tickets with gold `{ category, amount, currency, urgent }`, 2 few-shot examples, role text, CoT instruction, JSON schema), `prompts.ts`, `scoring.ts`, `probs.ts` (+ tests), `scripts/recordings/06-experiment.mjs`, `data/recordings/experiment.json`

**Interfaces:**
- Produces:
  - `type Combo = { role: boolean; fewShot: boolean; cot: boolean; schema: boolean }`; `ALL_COMBOS: Combo[]` (16); `comboKey(c): string` (e.g. `r1f0c1s0`)
  - `buildPrompt(task, combo, ticket): { system?: string; prompt: string; format?: object }` (schema on → Ollama `format` = schema; CoT with schema on → schema gains a leading `reasoning` string field; CoT with schema off → "think step by step, then give the JSON on the last line")
  - `extractJson(output: string): unknown | null` (last `{…}` block); `scoreExtraction(parsed, gold): { valid: boolean; fieldsCorrect: number; total: 4 }`
  - `variance(outputs: string[]): { distinct: number; of: number }` (distinct normalised JSON answers)
  - `tokenProbs(tokens: TokenProb[]): { token: string; p: number; alternatives: { token: string; p: number }[] }[]`
  - Recording keys: `<comboKey>:<ticketId>:s<n>` with samples n = 0 (temperature 0, logprobs) and 1–3 (temperature 0.8).
- [ ] **Step 1: Failing tests**: 16 distinct combos; prompt contains role/few-shot/CoT text exactly when toggled; schema combo sets `format`; `extractJson` takes the last block; **`invalid JSON scores as invalid`**; scoring counts fields; variance counts distinct answers; `tokenProbs` converts logprobs and sorts alternatives.
- [ ] **Step 2: Run** `npx vitest run src/subjects/06-prompt-engineering` — Expected: FAIL
- [ ] **Step 3: Implement**; run the experiment recording (16 × 8 × 4 = 512 calls; run in background, resumable via skip-existing); commit fixture
- [ ] **Step 4: Run** same + fixture validity test — Expected: PASS
- [ ] **Step 5: Commit** `feat(06): prompt experiment logic and recorded gemma4 runs`

### Task 9: Module 06 lesson

**Files:**
- Create: `src/subjects/06-prompt-engineering/{index.ts,steps.ts,challenges.ts,Stage.tsx}`, `views/*.tsx`, `views.test.tsx`
- Modify: `src/core/registry.ts`

**Interfaces:**
- Consumes: Tasks 1, 8; real o200k tokenizer via `loadEncoder` (`src/subjects/02-tokens-embeddings/realTokenizers.ts`) for prompt token counts.
- Steps (~10): bridge (04 used a one-line prompt); prompt anatomy; zero-shot vs few-shot; role/system prompts; chain-of-thought; structured outputs (JSON schema); the **Prompt Builder** (four toggles → full prompt, token count, per-combo accuracy and variance from the recorded experiment, outputs per ticket); the **Probability Inspector** (temperature-0 run: per-token probability and top alternatives); prompt chaining (a recorded 2-step chain: extract → draft reply, keys `chain:<ticketId>:1|2`); up next.
- [ ] **Step 1: Failing view tests**: toggling a component changes the shown prompt and the accuracy/variance numbers to that combo's recorded values; probability inspector lists alternatives for a clicked token; editing the ticket text → "No recording for this setting" with live option; token count updates.
- [ ] **Step 2: Run** `npx vitest run src/subjects/06-prompt-engineering` — Expected: FAIL
- [ ] **Step 3: Implement**; record the chain items
- [ ] **Step 4: Run** same + smoke — Expected: PASS
- [ ] **Step 5: Commit** `feat(06): prompt engineering module`

### Task 10: Release verification

**Files:** Modify `README.md`, `CLAUDE.md` (Ollama live mode, recording workflow, `src/llm/`), `docs/research/part2-sources.md` (complete for 04–06)

- [ ] **Step 1:** Bridges: Module 03 `leadsTo` → 04; 04 → 05 → 06 → 07 (coming soon) read as one story; `WhereThisFits` highlights correctly
- [ ] **Step 2: Run** `npm run typecheck && npm run test && BASE_PATH=/ConceptForge/ npm run build` and `du -sh dist` — Expected: all green; dist size reported
- [ ] **Step 3: Browser pass** (headless Chromium on the `/ConceptForge/` build, cream and dark): every step of 01, 04, 05, 06 and every quiz; no console errors; no requests to `localhost:11434` until Connect is clicked; phone width without horizontal scroll
- [ ] **Step 4: Commit** `docs: Part II release 1`
