# Tokenization Topic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three demo subjects with a curriculum-ready platform whose first topic is a 14-step, fact-checked, interactive Tokenization lesson with a mastery quiz.

**Architecture:** Subjects stay pluggable `SubjectModule`s; they gain curriculum metadata and the nav groups them by `category` (stage). Tokenization lives in `src/subjects/tokenization/` with pure, unit-tested algorithm modules (`bpe.ts`, `wordpiece.ts`, `unigram.ts`, `bytes.ts`, `realTokenizers.ts`) and one Stage that renders a view per step.

**Tech Stack:** React 19, Vite 7, TypeScript 5.9 strict, Tailwind 4, framer-motion, lucide-react, Vitest 4 + Testing Library, `js-tiktoken` (new).

**Spec:** `docs/superpowers/specs/2026-11-24-tokenization-design.md`

## Global Constraints

- Node 22 via nvm: prefix shell commands with `source ~/.nvm/nvm.sh &&`.
- Old subjects `transformers`, `distributed-systems`, `data-lakehouse` are deleted permanently (no backup commit).
- Every number shown in the UI is computed by real code or labelled as an example; facts come from `docs/research/tokenization-sources.md`, not memory.
- Each step: analogy first, ≤ 3 short body paragraphs, one `tryIt`, one `keyTakeaway`.
- Real tokenizers (`o200k_base`, `cl100k_base`) are dynamically imported, so they stay out of the initial bundle.
- Must work offline once loaded (no runtime network calls).
- Done = `npm run typecheck`, `npm run test`, `npm run build` all pass and the headless-browser pass reports no console errors.
- Commits: git identity is not configured yet. Run commit steps only once the owner supplies a name and email; otherwise leave the changes staged.

## Review Focus

1. Stale localStorage / URL hash pointing at a deleted subject (`#/transformers/3`, last-subject = `transformers`) → app opens Tokenization step 1, no crash. Test in Task 2.
2. Empty, whitespace-only, emoji/CJK and very long (> 2,000 chars) input in every text box → visuals cap and render, no errors. Tests in Tasks 3, 4, 7.
3. BPE corpus that yields no pairs (single characters, empty) or more merge steps than possible → trainer stops cleanly at "no more pairs". Test in Task 3.
4. Real-tokenizer chunk fails to load (offline first visit) → stage shows a readable error with retry, and the rest of the lesson works. Test in Task 4.
5. Answer shuffling plus hints: revealing a hint must not reveal or move the correct answer; scores are still saved. Test in Task 2.

---

### Task 1: Fact-check research notes

**Files:**
- Create: `docs/research/tokenization-sources.md`

**Interfaces:**
- Produces: the verified facts and the Further-reading list that Tasks 5–8 quote.

- [ ] **Step 1: Verify each claim against a primary source and record it with the URL.** Cover at least:
  - BPE merge rule and the original corpus example (Sennrich et al. 2016);
  - GPT-2 byte-level BPE, the `Ġ` marker and the 50,257 vocabulary (Radford et al. 2019, HF docs);
  - `cl100k_base` and `o200k_base` vocabulary sizes and which models use them (tiktoken repo);
  - WordPiece likelihood-based merges, `##`, `[UNK]`, BERT's 30,522 vocabulary (Schuster & Nakajima 2012, Devlin et al. 2019, HF course);
  - Unigram pruning, `▁`, subword regularisation (Kudo 2018, Kudo & Richardson 2018);
  - Llama 3's 128,256 vocabulary (model card);
  - ChatML `<|im_start|>`/`<|im_end|>` and BERT special tokens;
  - the SolidGoldMagikarp glitch-token story;
  - the tokenization explanation for counting letters in "strawberry".
- [ ] **Step 2: Verify the numbers by running the tokenizers** once `js-tiktoken` is installed (Task 4). Record the real counts for the step 11 language sentences, "strawberry" and number examples.
- [ ] **Step 3: Note any claim from the design that turned out wrong**, and fix it in the spec.

### Task 2: Platform changes (remove old subjects, metadata, grouped nav, takeaway, hints)

**Files:**
- Delete: `src/subjects/transformers/`, `src/subjects/distributed-systems/`, `src/subjects/data-lakehouse/`
- Create: `src/subjects/tokenization/` via `node scripts/create-subject.mjs tokenization "Tokenization" --register`, then edit `index.ts`
- Modify: `src/core/types.ts`, `src/core/registry.ts`, `src/components/TopNav.tsx`, `src/components/SplitWorkspace.tsx`, `src/components/ChallengeRunner.tsx`, `src/subjects/_template/*`, `scripts/create-subject.mjs`, `CLAUDE.md` (directory tree subject list, field names only)
- Test: `src/core/registry.test.ts`, `src/App.test.tsx`, `src/smoke.test.tsx`, `src/components/ChallengeRunner.test.tsx`, `src/core/route.test.ts`, `src/core/storage.test.ts`, `scripts/create-subject.test.ts`

**Interfaces:**
- Produces:
  - `SubjectModule` gains `category: string`, `difficulty: "beginner" | "intermediate" | "advanced"`, `estimatedMinutes: number`.
  - `LessonStep` gains `keyTakeaway?: string`.
  - `ChallengeItem` gains `hint?: string`.
  - `groupByCategory(subjects): { category: string; subjects: SubjectModule[] }[]` in `registry.ts`, keeping registration order.
  - Tokenization: `category: "Stage 1 · Text-to-Number Foundations"`, `difficulty: "beginner"`, `estimatedMinutes: 45`, accent `sky`.

- [ ] **Step 1: Write failing tests.**
  - `registry.test.ts`: `groupByCategory` keeps order and groups; `validateSubject` flags `estimatedMinutes <= 0` and an empty `category`.
  - `App.test.tsx`: rewrite against `SUBJECTS[0]` only (no `SUBJECTS[1]`). Add `it("falls back to the first subject for a deleted subject in the hash or storage")` with hash `#/transformers/3` and `LAST_SUBJECT_KEY = "transformers"` → heading equals `SUBJECTS[0].steps[0].title`.
  - `TopNav`: the subject menu button opens a list with a `group` labelled `Stage 1 · Text-to-Number Foundations` containing a `Tokenization` item.
  - `ChallengeRunner.test.tsx`: the "Show hint" button reveals the hint text; the correct option stays at the same position after revealing it.
  - `SplitWorkspace`: renders `keyTakeaway` when present.
- [ ] **Step 2: Run tests.** `source ~/.nvm/nvm.sh && npm run test`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement.**
  - Delete the three subject folders and the registry imports.
  - Add the fields, plus `validateSubject` checks.
  - `TopNav`: replace the flat tabs with a dropdown button (current subject icon and title) that opens a panel of category headings with subject rows (icon, title, difficulty, minutes, % explored). Close on select, on Esc and on outside click.
  - `SplitWorkspace`: show a takeaway box under the body.
  - `ChallengeRunner`: a "Show hint" link before checking.
  - Template and script: emit the new fields.
  - CLAUDE.md: the subject list becomes `tokenization/`, and note the actual names (`Stage`, `accent`, `body`, `view`).
- [ ] **Step 4: Run** `npm run typecheck && npm run test`. Expected: PASS.
- [ ] **Step 5: Commit** (see Global Constraints): `refactor: curriculum metadata, grouped subject menu; remove demo subjects`.

### Task 3: Teaching algorithms (BPE, WordPiece, Unigram, bytes)

**Files:**
- Create: `src/subjects/tokenization/bpe.ts`, `wordpiece.ts`, `unigram.ts`, `bytes.ts`, `chop.ts`
- Test: matching `*.test.ts` files

**Interfaces:**
- Produces:
  - `chop.ts`: `splitChars(text): string[]`, `splitWords(text): string[]` (words and punctuation).
  - `bpe.ts`: `type Merge = { pair: [string, string]; merged: string; count: number }`; `trainBpe(corpus: string, numMerges: number): { merges: Merge[]; vocab: string[]; snapshots: BpeSnapshot[] }` where `BpeSnapshot = { step: number; words: { symbols: string[]; freq: number }[]; pairCounts: { pair: [string, string]; count: number }[] }`; `encodeBpe(word: string, merges: Merge[]): { tokens: string[]; trace: { merge: Merge; before: string[]; after: string[] }[] }`. Words end with the marker `</w>`. Ties break by first occurrence in the pair-count scan, so the order is deterministic.
  - `wordpiece.ts`: `WORDPIECE_VOCAB: string[]`; `encodeWordPiece(text: string, vocab?: string[]): { tokens: string[]; steps: { word: string; tried: string[]; matched: string | null }[] }` (greedy longest-match-first, `##` continuations, `[UNK]` for the whole word on failure, words capped at 100 chars).
  - `unigram.ts`: `UNIGRAM_VOCAB: Record<string, number>` (log-probs, `▁`-prefixed pieces); `bestSegmentation(text): { pieces: string[]; logProb: number }` (Viterbi over `▁`-normalised text); `topSegmentations(text, k): { pieces: string[]; logProb: number }[]`.
  - `bytes.ts`: `utf8Bytes(ch: string): number[]`; `byteTable(text): { char: string; bytes: number[] }[]` (iterates code points, not UTF-16 units).

- [ ] **Step 1: Write failing tests.**
  - `trainBpe("low low low low low lower lower newest newest newest newest newest newest widest widest widest", 10)` first merges include `e s` → `es` then `es t` → `est`.
  - `encodeBpe("lowest", merges)` yields `["low", "est</w>"]`.
  - Corpus `"a"` and `""` return zero merges without throwing; `numMerges` larger than possible stops early.
  - `encodeWordPiece("unaffable")` → `["un", "##aff", "##able"]` with the built-in vocab; a word of unknown characters → `["[UNK]"]`.
  - `bestSegmentation("hello world").pieces` starts with `▁hello` and has the highest logProb among `topSegmentations(..., 3)`; results are sorted descending.
  - `utf8Bytes("é")` length 2; `"你"` 3; `"🤖"` 4; `byteTable("a🤖")` has 2 rows.
  - All functions accept a 5,000-char string in under 200 ms.
- [ ] **Step 2: Run them.** `npm run test -- src/subjects/tokenization`. Expected: FAIL.
- [ ] **Step 3: Implement** each function per its signature. Vocabularies: `WORDPIECE_VOCAB` (≈150 entries covering the examples), `UNIGRAM_VOCAB` (≈150 entries, log-probs summing sensibly).
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit**: `feat(tokenization): BPE, WordPiece, Unigram and byte helpers`.

### Task 4: Real GPT tokenizers

**Files:**
- Create: `src/subjects/tokenization/realTokenizers.ts`, `src/subjects/tokenization/useRealTokenizer.ts`
- Modify: `package.json` (`npm install --save-exact js-tiktoken`)
- Test: `realTokenizers.test.ts`, `useRealTokenizer.test.tsx`

**Interfaces:**
- Produces:
  - `type EncodingName = "o200k_base" | "cl100k_base"`;
  - `ENCODINGS: Record<EncodingName, { label: string; models: string; vocabSize: number }>` (values from Task 1);
  - `loadEncoder(name): Promise<{ encode(text: string): number[]; decodeToken(id: number): string }>` (dynamic `import("js-tiktoken/ranks/<name>")`, cached);
  - `useRealTokenizer(name, text): { status: "loading" | "ready" | "error"; tokens: { id: number; text: string }[]; retry(): void }`, capped at the first 4,000 characters.

- [ ] **Step 1: Write failing tests.**
  - `"hello world"` encodes to 2 tokens in both encodings.
  - Decoding every id of a mixed English/emoji/Hindi string and joining reproduces the text.
  - `""` → `[]`.
  - The hook goes `loading` → `ready`.
  - With `loadEncoder` mocked to reject, the hook reports `error`, and `retry()` recovers once the mock resolves.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Install `js-tiktoken` and implement.** Partial-UTF-8 tokens decode to `�`; display them as byte placeholders such as `<0xE0>`.
- [ ] **Step 4: Run.** Expected: PASS. Then finish Task 1 Step 2 with real counts.
- [ ] **Step 5: Commit**: `feat(tokenization): real o200k/cl100k tokenizers, lazy-loaded`.

### Task 5: Lesson steps 1–5 (numbers, chopping, vocabulary, BPE training, BPE encoding)

**Files:**
- Create: `src/subjects/tokenization/steps.ts` (all 14 steps' copy, from Task 1 facts), `Stage.tsx` (shell: switch on `step.view`), `views/IntroView.tsx`, `views/ChopView.tsx`, `views/VocabView.tsx`, `views/BpeTrainView.tsx`, `views/BpeEncodeView.tsx`
- Test: `src/subjects/tokenization/views.test.tsx`

**Interfaces:**
- Consumes: Task 3 functions; `Panel`, `Slider`, `Toggle`, `Segmented`, `Stat`, `Bar` from `src/components/ui.tsx`.
- Produces: the step `view` keys `intro`, `chop`, `vocab`, `bpe-train`, `bpe-encode`, `bytes`, `wordpiece`, `unigram`, `special`, `playground`, `languages`, `quirks`, `practice`, `cheatsheet`, in step order. Shared Stage state: `sampleText` (default `"Unbelievably, the tokenizer handled 🤖 emoji!"`) and `corpus`.

- [ ] **Step 1: Write failing view tests.**
  - Intro shows each piece with a numeric id.
  - Chop shows three rows with counts, and the word row marks an out-of-vocabulary word.
  - Vocab slider at 1,000 vs 200,000 changes both "tokens for this text" and "embedding table size".
  - BPE train: "Next merge" increments the merge counter and shows the chosen pair; "Reset" goes back to 0; editing the corpus to `"a"` shows "No more pairs to merge".
  - BPE encode: typing `lowest` shows the merge trace ending in `low` + `est</w>`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement the views and all `steps.ts` copy** (14 steps, ids matching the view keys, each with `tryIt` and `keyTakeaway`).
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit**: `feat(tokenization): steps 1-5 views and lesson copy`.

### Task 6: Lesson steps 6–9 (bytes, WordPiece, Unigram/SentencePiece, special tokens)

**Files:**
- Create: `views/BytesView.tsx`, `views/WordPieceView.tsx`, `views/UnigramView.tsx`, `views/SpecialTokensView.tsx`
- Test: extend `views.test.tsx`

- [ ] **Step 1: Write failing tests.**
  - The bytes view lists 4 bytes for `🤖` and shows the `Ġ` explanation for a leading space.
  - The WordPiece view shows the longest-match attempts for `unaffable` and `##` pieces.
  - The Unigram view lists the top 3 segmentations with probabilities, the best one highlighted.
  - The special-tokens view renders a ChatML template, with `<|im_start|>` marked as a special token. A user message containing the literal text `<|im_end|>` is shown being encoded as ordinary text, not as the special token, with the injection note.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit**: `feat(tokenization): steps 6-9 views`.

### Task 7: Lesson steps 10–14 (playground, languages, quirks, practice, cheat sheet)

**Files:**
- Create: `views/PlaygroundView.tsx`, `views/LanguagesView.tsx`, `views/QuirksView.tsx`, `views/PracticeView.tsx`, `views/CheatSheetView.tsx`
- Test: extend `views.test.tsx`

**Interfaces:**
- Consumes: `useRealTokenizer`, `ENCODINGS` (Task 4); verified sentences and counts from `docs/research/tokenization-sources.md`.
- Produces: pure helpers in `practice.ts`:
  - `estimateCost(tokens: number, pricePerMillion: number): number`;
  - `chunkByTokens(ids: number[], size: number, overlap: number): [start, end][]` (throws if `overlap >= size`; the UI prevents that).

- [ ] **Step 1: Write failing tests.**
  - Playground: colours each token and shows counts for both encodings. Empty input shows "0 tokens". A 10,000-char paste shows the "first 4,000 characters" note. The error state shows a Retry button.
  - Languages: one row per language with a real count and a "× English" ratio.
  - Quirks: the strawberry card shows its token split.
  - Practice: `estimateCost(1_000_000, 2.5) === 2.5`; `chunkByTokens(range 0..9, 4, 1)` → `[[0,4],[3,7],[6,10]]`; the context bar turns red when tokens exceed the window.
  - Cheat sheet: has a "Further reading" list with ≥ 6 links, all `https://`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The price input defaults to an example labelled "example price, check your provider".
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit**: `feat(tokenization): steps 10-14 views`.

### Task 8: Mastery challenges and full verification

**Files:**
- Create: `src/subjects/tokenization/challenges.ts`
- Modify: `README.md` (subject table, curriculum section)

- [ ] **Step 1: Write ~15 scenario questions**, each with `hint`, `explanation` and `relatedStepId`, covering the spec's challenge list. Rely on registry validation (≥ 5 challenges, valid links) and the smoke test, which already answers every question correctly.
- [ ] **Step 2: Run** `npm run typecheck && npm run test && npm run build`. Expected: all pass, and the build output shows separate chunks for `o200k_base` and `cl100k_base`.
- [ ] **Step 3: Headless-browser pass.** Use the Playwright Docker check script, updated for the single subject. It steps through all 14 steps, waits for the playground to reach `ready`, takes the quiz and checks phone width. Expected: "NO PROBLEMS". Review the screenshots by eye.
- [ ] **Step 4: Commit**: `feat(tokenization): mastery challenges; docs`.
