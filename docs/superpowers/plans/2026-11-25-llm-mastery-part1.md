# LLM Mastery Part I Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure ConceptForge into the LLM Mastery track (Parts I–IV, Modules 01–14 with connecting "where this fits" / "up next" links) and build Part I: Modules 01, 02 and 03 with real in-browser embeddings.

**Architecture:** Each module is a `SubjectModule` with `part`, `moduleNumber` and `bridge`; a static `TRACK` lists all 14 curriculum modules so unbuilt ones show as "coming soon". A shared embedding engine (`src/ml/`) runs the self-hosted all-MiniLM-L6-v2 through transformers.js. Module logic lives in pure, unit-tested files; each module's Stage renders one view per step.

**Tech Stack:** React 19, Vite 7, TypeScript 5.9 strict, Tailwind 4, framer-motion, Vitest 4, js-tiktoken, `@huggingface/transformers` 4.3.2 (new; Apache-2.0).

**Spec:** `docs/superpowers/specs/2026-11-25-llm-mastery-part1-design.md` (curriculum: `docs/curriculum.md`)

## Global Constraints

- Node 22 via nvm: prefix commands with `source ~/.nvm/nvm.sh &&`. Git identity is set; commit per task and push only at the milestone end (a push deploys to GitHub Pages).
- Module ids exactly as in the curriculum: `01-intro-llms`, `02-tokens-embeddings`, `03-transformer-internals`, `04-text-classification`, `05-clustering-topics`, `06-prompt-engineering`, `07-agents-tools`, `08-semantic-search-rag`, `09-multimodal-llms`, `10-training-embeddings`, `11-finetuning-encoders`, `12-finetuning-generation`, `13-inference-serving`, `14-evals-guardrails`.
- Part titles: `Part I · Understanding Language Models`, `Part II · Using Pretrained Language Models`, `Part III · Training and Fine-Tuning Language Models`, `Part IV · Production Inference & Guardrails`.
- Model: `Xenova/all-MiniLM-L6-v2`, quantized ONNX (`onnx/model_quantized.onnx`, 22,972,370 bytes) plus `config.json`, `tokenizer.json`, `tokenizer_config.json`, `special_tokens_map.json`, self-hosted under `public/models/Xenova/all-MiniLM-L6-v2/`. `env.allowRemoteModels = false`. The ONNX Runtime WASM files are also self-hosted (no CDN at runtime). Lazy-load: never part of the initial bundle.
- Every number is computed by real code or labelled "illustrative". Facts come from `docs/research/` notes, not memory.
- Every built module has: `bridge.buildsOn` and `bridge.leadsTo`; a first step showing the "Where this fits" map; a last step with an "Up next" card; practice questions with `hint` and `relatedStepId` (≥ 4 per module).
- Gate per module task: `npm run typecheck && npm run test`. Milestone gate: plus `npm run build` and a headless-browser pass served from `/ConceptForge/`.

## Review Focus

1. Embedding model can't load (offline first visit, slow mobile, wasm blocked) → visible loading progress, then a readable error with Retry and "reload if it keeps failing"; non-model steps keep working. Test in Task 3.
2. The "bank" visualizer when the learner edits a sentence so "bank" is missing, appears twice or splits into several word pieces (e.g. "banking") → it picks the matching word (averaging its pieces) or says "type the word bank in both sentences", never crashes. Test in Task 5.
3. Old bookmarks and saved progress for `tokenization` (`#/tokenization/7`, last-subject `tokenization`) → open Module 02 at the same step, with visited steps kept. Test in Task 2.
4. Deep links and menu clicks to unbuilt modules (`#/07-agents-tools/1`) → a "coming soon" card that names the module and its place on the map, no crash. Test in Task 2.
5. Too much text for the embedder (many sentences, > 256 word pieces) → inputs capped (max 8 sentences; the model truncates at 256 pieces) with a visible note. Test in Task 3.

---

### Task 1: Fact-check notes for Part I

**Files:** Create `docs/research/part1-sources.md`.

- [ ] **Step 1: Verify and record (claim → source URL)**:
  - BERT is an encoder-only, bidirectional model with a masked-LM objective (Devlin et al. 2019);
  - GPT is decoder-only and causal (Radford et al.);
  - T5 is encoder-decoder (Raffel et al. 2020);
  - Transformer, scaled dot-product attention and sinusoidal positions (Vaswani et al. 2017);
  - RoPE: rotation by position, so the dot product depends on relative position (Su et al. 2021);
  - GQA (Ainslie et al. 2023);
  - RMSNorm (Zhang & Sennrich 2019);
  - SwiGLU (Shazeer 2020) and GELU (Hendrycks & Gimpel);
  - top-k (Fan et al. 2018) and nucleus top-p (Holtzman et al. 2020);
  - Bag-of-Words definition;
  - all-MiniLM-L6-v2 model card: 384 dimensions, mean pooling, 256 word-piece input limit, licence;
  - pre-training vs fine-tuning (BERT and GPT papers).
- [ ] **Step 2: Note anything in the design that turned out wrong, and fix the spec.**
- [ ] **Step 3: Commit** `docs: Part I fact-check notes`.

### Task 2: Track model, module selector, connecting-the-dots UI

**Files:**
- Create: `src/core/track.ts`, `src/components/WhereThisFits.tsx`, `src/components/BridgeCard.tsx`, `src/components/ComingSoon.tsx`.
- Modify: `src/core/types.ts`, `src/core/registry.ts`, `src/core/route.ts`, `src/App.tsx`, `src/components/TopNav.tsx`, `src/components/StepControls.tsx`, `src/components/SplitWorkspace.tsx`, `src/subjects/_template/*`, `scripts/create-subject.mjs`, `CLAUDE.md` (subject list).
- Move: `src/subjects/tokenization/` → `src/subjects/02-tokens-embeddings/` (id `02-tokens-embeddings`, title "Tokens and Embeddings").
- Test: `src/core/track.test.ts`, `src/App.test.tsx`, `src/core/registry.test.ts`, `scripts/create-subject.test.ts`, `src/components/StepControls.test.tsx`.

**Interfaces:**
- Produces:
  - `SubjectModule` adds `part: 1 | 2 | 3 | 4`, `moduleNumber: number`, `bridge: { buildsOn: string; leadsTo: string }`.
  - `LessonStep` adds `section?: string` and `callout?: string`.
  - `TRACK: readonly TrackEntry[]`, where `TrackEntry = { id: string; moduleNumber: number; title: string; part: 1 | 2 | 3 | 4 }`.
  - `PART_TITLES: Record<1 | 2 | 3 | 4, string>`.
  - `trackGroups(subjects): { part; title; modules: { entry: TrackEntry; subject?: SubjectModule }[] }[]`.
  - `nextModule(id): TrackEntry | undefined`.
  - `LEGACY_IDS: Record<string, string>` = `{ tokenization: "02-tokens-embeddings" }`.
  - `<WhereThisFits moduleNumber={n} />`, `<BridgeCard kind="buildsOn" | "upNext" subject={…} />` and `<ComingSoon entry={…} />`.

- [ ] **Step 1: Write failing tests.**
  - **track.test:**
    - `TRACK` has exactly the 14 curriculum ids in order, numbers 1–14, parts [1,1,1,2,2,2,2,2,2,3,3,3,4,4];
    - `nextModule("03-transformer-internals")?.id === "04-text-classification"`;
    - `nextModule("14-evals-guardrails") === undefined`.
  - **registry.test:** every registered subject's id is in `TRACK` with a matching number and part, and has non-empty `bridge` strings.
  - **App.test:**
    - `#/tokenization/7` opens Module 02 at step 7;
    - stored progress under `tokenization` is migrated to `02-tokens-embeddings`;
    - `#/07-agents-tools/1` shows a "Coming soon" heading naming "Advanced Text Generation Techniques & Tools";
    - the menu lists 4 part groups and 14 module items, unbuilt ones `aria-disabled="true"`.
  - **StepControls.test:** with steps in sections "Tokens" and "Embeddings", the scrubber renders a labelled group per section.
  - **create-subject.test:** the template emits `part`, `moduleNumber` and `bridge`.
- [ ] **Step 2: Run them.** `npm run test`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement.**
  - Do the folder move with `git mv` and update ids and imports.
  - `route.ts` maps `LEGACY_IDS`; `storage.ts` migrates legacy progress keys on load.
  - In `App`: a hash for a TRACK id that isn't built renders `ComingSoon`.
  - `TopNav` groups by `trackGroups`.
  - `SplitWorkspace` renders `callout` (monospace box), `WhereThisFits` (compact) in the left-pane header, and the bridge cards on the first and last steps.
- [ ] **Step 4: Run** `npm run typecheck && npm run test`. Expected: PASS.
- [ ] **Step 5: Commit** `refactor: LLM Mastery track (parts/modules, where-this-fits, bridges)`.

### Task 3: In-browser embedding engine (MiniLM)

**Files:**
- Create: `src/ml/embeddings.ts`, `src/ml/useEmbeddings.ts`, `src/ml/vector.ts`, `scripts/fetch-model.mjs`, `public/models/Xenova/all-MiniLM-L6-v2/**`.
- Modify: `package.json` (dependency plus a `fetch-model` script), `vite.config.ts` (copy the ORT wasm files into the build).
- Test: `src/ml/vector.test.ts`, `src/ml/embeddings.test.ts` (`// @vitest-environment node`), `src/ml/useEmbeddings.test.tsx`.

**Interfaces:**
- Produces:
  - `vector.ts`: `cosine(a: ArrayLike<number>, b: ArrayLike<number>): number`; `meanPool(vectors: ArrayLike<number>[]): Float32Array`.
  - `embeddings.ts`:
    - `MAX_SENTENCES = 8`;
    - `loadEmbedder(): Promise<Embedder>`, cached, with failures not cached;
    - `Embedder = { embedSentences(texts: string[]): Promise<Float32Array[]>; embedTokens(text: string): Promise<{ tokens: string[]; vectors: Float32Array[] }> }`. `embedSentences` returns normalized 384-d vectors (mean pooling); `embedTokens` returns per-word-piece contextual vectors, without [CLS] and [SEP].
  - `useEmbeddings(): { status: "loading" | "ready" | "error"; progress: number; embedder: Embedder | null; retry(): void }`, with an injectable loader.

- [ ] **Step 1: Download the model files with `scripts/fetch-model.mjs`** (5 files from `https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/`). Check that `onnx/model_quantized.onnx` is 22,972,370 bytes, and commit the files.
- [ ] **Step 2: Write failing tests.**
  - **vector.test:** `cosine([1,0],[0,1]) === 0`, `cosine([1,2],[2,4]) ≈ 1`, and a zero vector gives 0, not NaN.
  - **embeddings.test (real model, node):**
    - `embedSentences(["The film was great", "The movie was excellent", "Interest rates rose today"])` gives 3 vectors of length 384 with norm ≈ 1;
    - sim(0,1) > sim(0,2) + 0.3;
    - `embedTokens("The bank approved the loan").tokens` equals `["the","bank","approved","the","loan"]`;
    - the "bank" vector differs between the "loan" and "river" sentences: cosine < 0.95, but > 0.3.
  - **Input caps:** `embedSentences` of 12 texts rejects with a message about the 8-sentence limit, or the hook caps it (pick one and test it). A 2,000-word text still embeds (truncated by the model).
  - **useEmbeddings.test:** loading → ready; loader rejects → `error`; `retry()` → ready.
- [ ] **Step 3: Run.** Expected: FAIL.
- [ ] **Step 4: Implement.**
  - Configure `env.localModelPath` to `import.meta.env.BASE_URL + "models/"` in the browser and the absolute `public/models/` path in Node.
  - Set `env.allowRemoteModels = false`.
  - Set `env.backends.onnx.wasm.wasmPaths` to the self-hosted wasm folder.
  - Use `pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "q8" })`.
  - Get token strings from `pipe.tokenizer`.
- [ ] **Step 5: Run.** Expected: PASS. Run `npm run build` and confirm the model and wasm are under `dist/` and not in the main chunk.
- [ ] **Step 6: Commit** `feat: in-browser MiniLM embedding engine (self-hosted)`.

### Task 4: Module 01 — Introduction to Language Models

**Files:**
- Create: `src/subjects/01-intro-llms/{index.ts,steps.ts,challenges.ts,Stage.tsx,bow.ts,architectures.ts,views/*}`.
- Test: `bow.test.ts`, `architectures.test.ts`, `views.test.tsx`.

**Interfaces:**
- Consumes: Task 2 components; Task 3 `useEmbeddings`, `cosine`.
- Produces:
  - `bow.ts`: `bagOfWords(texts: string[]): { vocab: string[]; counts: number[][] }` (lower-cased words, vocabulary in first-seen order); `bowCosine(a: number[], b: number[]): number`.
  - `architectures.ts`: `type Arch = "bow" | "encoder" | "decoder" | "encoder-decoder"`; `visibility(arch, n): boolean[][]` (row i = which positions token i can see; bow = only itself, encoder = all, decoder = j ≤ i; encoder-decoder returns the decoder's self-attention); `outputKind(arch): string`.

- [ ] **Step 1: Write failing tests.**
  - `bagOfWords(["the cat sat","the cat ran"]).vocab` is `["the","cat","sat","ran"]` and `counts` is `[[1,1,1,0],[1,1,0,1]]`.
  - `bowCosine` of "the film was great" vs "the movie was excellent" is 0.5 (2 of 4 words shared).
  - `visibility("decoder",3)` is lower-triangular; `visibility("encoder",3)` is all true.
  - **Views:**
    - the BoW view shows a count table;
    - the dense view (ready after load) shows a real similarity for the paraphrase pair that is higher than its BoW cosine;
    - the comparator toggling Encoder/Decoder changes the highlighted cells;
    - step 1 renders `WhereThisFits`;
    - the last step renders an "Up next" card for Module 02.
  - `subject.test`: ≥ 8 steps, ≥ 4 challenges, a valid bridge.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement the 9 steps per the spec** (big picture and track map; BoW; dense embeddings; context; architecture comparator; encoder-decoder; representation vs generative flow; pre-training vs fine-tuning timeline; up next). Copy comes from Task 1 notes. Each step has `tryIt`, `keyTakeaway`, and `callout` where a formula or metric applies.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: Module 01 Introduction to Language Models`.

### Task 5: Module 02 — Tokens and Embeddings (embeddings section)

**Files:**
- Modify: `src/subjects/02-tokens-embeddings/{steps.ts,challenges.ts,Stage.tsx,views/PlaygroundView.tsx,views/CheatSheetView.tsx}`.
- Create: `views/LookupTableView.tsx`, `views/StaticContextualView.tsx`, `views/BankShiftView.tsx`, `views/SentenceEmbeddingsView.tsx`, `views/SemanticPreviewView.tsx`, `bank.ts`.
- Test: `bank.test.ts`, `views.test.tsx` (extended).

**Interfaces:**
- Consumes: `useEmbeddings`, `cosine`, `meanPool`.
- Produces: `findWord(tokens: string[], word: string): number[][]`, the word-piece index groups for each occurrence of `word` (pieces `##`-joined, case-insensitive).

- [ ] **Step 1: Write failing tests.**
  - `findWord(["the","bank","##ing","bank"], "banking")` → `[[1,2]]`; `findWord(["the","river","bank"], "bank")` → `[[2]]`; `findWord(["a"], "bank")` → `[]`.
  - Existing 14 token steps get `section: "Tokens"` and the new ones `section: "Embeddings"`. The cheat sheet moves to last place and covers both.
  - The Playground has preset buttons "English", "Code", "Numbers", "Multilingual".
  - **Bank view:**
    - shows a real cosine for `bank` across the two default sentences;
    - editing one sentence to remove "bank" shows "type the word bank in both sentences" and no error;
    - a sentence with "bank" twice uses the first occurrence and says so.
  - The sentence-embeddings view shows an n × n similarity matrix; 9 sentences are capped to 8 with a note.
  - The module has ≥ 4 new embedding questions.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement the 6 embedding steps per the spec.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: Module 02 embeddings section (real MiniLM)`.

### Task 6: Module 03 — Looking Inside Large Language Models

**Files:**
- Create: `src/subjects/03-transformer-internals/{index.ts,steps.ts,challenges.ts,Stage.tsx,positional.ts,attention.ts,norms.ts,ffn.ts,sampling.ts,kvcache.ts,views/*}`.
- Test: one `*.test.ts` per logic file, plus `views.test.tsx`.

**Interfaces (pure logic):**
- `positional.ts`: `sinusoidal(pos, dim): number[]`; `rope(vec: number[], pos: number): number[]` (rotate each pair (2i, 2i+1) by `pos · 10000^(−2i/d)`).
- `attention.ts`: `HEADS` (4 illustrative heads, labelled), `attentionMatrix(tokens, head, causal): number[][]`, `softmax(xs, temperature = 1)`.
- `norms.ts`: `layerNorm(x, eps = 1e-5)`; `rmsNorm(x, eps = 1e-6)`.
- `ffn.ts`: `gelu(x)` (tanh approximation); `silu(x)`; `swiglu(xGate, xUp): number[]`.
- `sampling.ts`: `applySampling(cands, { temperature, topK, topP })` → probabilities with kept flags; `greedy(cands)`.
- `kvcache.ts`: `kvCost({ promptTokens, generatedTokens, layers, kvHeads, headDim, bytesPerValue }, cacheOn)` and `kvCacheBytes(…)` (2 × layers × kvHeads × headDim × tokens × bytes).

- [ ] **Step 1: Write failing tests.**
  - `rope`: cosine(rope(q, m), rope(k, n)) depends only on m − n, i.e. equal for (m, n) = (5, 2) and (13, 10) within 1e-9; norms are preserved.
  - `rmsNorm([3, 4])` has RMS 1; `layerNorm` output has mean 0 and variance 1.
  - `gelu(0) === 0`, `gelu(3) ≈ 2.9964`; `silu(0) === 0`.
  - Softmax rows sum to 1; causal entries above the diagonal are 0.
  - `topK = 1` equals greedy; `topP = 0.8` keeps the smallest nucleus; temperature → 0.01 gives a near one-hot result.
  - GQA: `kvCacheBytes` with 8 KV heads is ¼ of the value with 32 KV heads, all else equal.
  - **Views:**
    - attention arcs appear for the clicked token, and the head selector changes the heatmap;
    - the causal toggle zeros the upper triangle;
    - the sampling sliders change the bars;
    - KV ON/OFF changes the totals;
    - the "illustrative" label is present on the attention and logits views.
  - `subject.test`: ≥ 12 steps, ≥ 6 challenges, valid bridge; the last step's Up-next card points to Module 04 (coming soon).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement the 12 steps per the spec,** with copy from Task 1 notes and `callout` formulas (`softmax(QKᵀ/√d)·V`, `RMSNorm(x) = x / √(mean(x²)+ε) · g`, `SwiGLU(x) = (xW·σ(xW)) ⊙ xV`, `KV bytes = 2·L·H_kv·d_head·T·b`).
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: Module 03 Looking Inside LLMs`.

### Task 7: Milestone verification and deploy

**Files:** Modify `README.md` (track table), `src/smoke.test.tsx` (if needed for multi-module).

- [ ] **Step 1: Run** `npm run typecheck && npm run test && BASE_PATH=/ConceptForge/ npm run build`. Expected: all pass; model and vocab files in separate assets; main chunk < 200 KB gzip.
- [ ] **Step 2: Headless-browser pass** served from `/ConceptForge/`: every step of 01–03, controls, all quizzes, the model loading to ready, a coming-soon link, phone width. Expected "NO PROBLEMS"; review the screenshots.
- [ ] **Step 3: Final whole-milestone review** by a fresh reviewer; fix Important findings test-first.
- [ ] **Step 4: Commit and push** to `master`, then confirm the GitHub Pages run succeeds and the live site loads the model.
