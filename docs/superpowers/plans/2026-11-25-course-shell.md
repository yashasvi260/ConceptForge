# Course Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give ConceptForge the `example.md` shell: a course overview home page with syllabus completion, module
cards with status, a syllabus drawer, breadcrumbs, Guided Steps / Practice Check tabs, a segmented step bar and an
"Up next in syllabus" card.

**Architecture:** Pure progress maths in `src/core/courseProgress.ts`; the app gets a `view: "course" | "module"`
state driven by the hash (`#/` = course). New presentational components (`AppHeader`, `CourseOverview`,
`SyllabusDrawer`, `UpNextCard`) replace `TopNav`; `StepControls` and `SplitWorkspace` are restyled, not rewritten.
Lesson content, stages and the ML engine are untouched.

**Tech Stack:** React 19, TypeScript strict, Tailwind 4, lucide-react, framer-motion, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-25-course-shell-design.md`

## Global Constraints

- Module complete = every step viewed **and** practice check attempted at least once (`visitedSteps`, `attempts`).
- Course completion = completed modules / all 14 `TRACK` modules (unbuilt count in the total).
- Up next = first built module not complete; if all built ones are complete, the first unbuilt one ("coming soon");
  `null` when all 14 are complete.
- Routes: `#/` (or empty) course overview; `#/<id>/<step>` player; `#/<id>/quiz` practice check; `#/<id>/challenge`
  and legacy ids (`tokenization`) still accepted.
- No catalog, no sandbox tab, no production notes. One `COURSE` object so a catalog can be added later.
- Look: dark engineering grid — slate-900/95 panels, `border-slate-800`, `rounded-2xl`, cyan accent for the shell,
  mono uppercase labels; the stage body uses a `.stage-grid` background.
- Keep: real model, ← → Space shortcuts, Auto-Play, saved progress, phone layout, `BASE_PATH` Pages build.
- Commands need `source ~/.nvm/nvm.sh &&` first. Work on branch `course-shell`; merge to master and push only with
  the owner's OK.

## Review Focus

1. Saved `visitedSteps` containing ids of steps that no longer exist — counts must use current step ids only, never
   exceed 100% or mark a module complete (Task 1 test `ignores stale step ids`).
2. Browser back/forward between `#/` and a module — the view must follow the hash (Task 4 test `back to #/ shows the
   course overview`).
3. Arrow keys / Space on the course overview must do nothing (Task 4 test `shortcuts are off on the course page`).
4. Auto-Play running when the learner goes home or opens another module must stop (Task 4 test `going home stops
   auto-play`).
5. Phone width (390 px): drawer usable, cards stacked, no horizontal scroll — checked in the Task 5 browser pass.

---

### Task 1: Course data and progress maths

**Files:**
- Modify: `src/core/track.ts` (add `COURSE`, `tags` on `TrackEntry`)
- Create: `src/core/courseProgress.ts`, `src/core/courseProgress.test.ts`
- Modify: `src/core/track.test.ts`

**Interfaces:**
- Produces:
  - `COURSE: { id: "llm-mastery"; title: "LLM Mastery"; description: string }`
  - `TrackEntry.tags: string[]` (2–4 short tags per module from `docs/curriculum.md` core concepts, e.g. Module 03:
    `["Self-Attention", "RoPE", "KV Cache", "Sampling"]`)
  - `type ModuleStatus = { kind: "coming-soon" } | { kind: "not-started"; total: number } | { kind: "in-progress"; seen: number; total: number } | { kind: "complete"; total: number }`
  - `moduleStatus(subject: SubjectModule | undefined, progress: ProgressMap): ModuleStatus`
  - `courseSummary(subjects: readonly SubjectModule[], progress: ProgressMap): { completed: number; total: number; percent: number }` (percent rounded)
  - `partSummary(part: PartNumber, subjects, progress): { completed: number; total: number }`
  - `resumeTarget(subjects, progress): { entry: TrackEntry; built: boolean } | null`
  - `quizBadge(subject: SubjectModule, progress: ProgressMap): string` → `"<best correct>/<challenges.length>"`, `"0/<n>"` if never attempted

- [ ] **Step 1: Write the failing tests** in `courseProgress.test.ts` using a two-step fake subject (`id: "01-intro-llms"`) and real `TRACK`:
  - `coming soon for an unbuilt module` → `moduleStatus(undefined, {})` is `{kind:"coming-soon"}`
  - `not started` → `{kind:"not-started", total:2}`
  - `in progress counts seen steps` → visited `["a"]` gives `{kind:"in-progress", seen:1, total:2}`; attempts 1 with no steps also in-progress (seen 0)
  - `complete needs every step and a quiz attempt` → visited `["a","b"]`, attempts 0 → in-progress; attempts 1 → complete
  - `ignores stale step ids` → visited `["a","old-1","old-2"]` → `seen` 1
  - `course summary counts all 14` → one complete module → `{completed:1,total:14,percent:7}`
  - `part summary` → part 1 with one complete → `{completed:1,total:3}`
  - `resume target` → nothing done → Module 01 built; 01 complete → next built; all built complete → first unbuilt with `built:false`
  - `quiz badge` → `"0/<n>"` then `"5/<n>"` after bestScore `{correct:5,total:n}`
  - in `track.test.ts`: `every module has 2–4 tags` and `COURSE.title === "LLM Mastery"`
- [ ] **Step 2: Run** `npx vitest run src/core` — Expected: FAIL (module not found / tags undefined)
- [ ] **Step 3: Implement** `COURSE`, tags, and `courseProgress.ts` per Interfaces (status uses only current `subject.steps` ids)
- [ ] **Step 4: Run** `npx vitest run src/core` — Expected: PASS
- [ ] **Step 5: Commit** `feat(core): course data and progress maths for the course shell`

### Task 2: Routes for home and quiz

**Files:** Modify `src/core/route.ts`, `src/core/route.test.ts`

**Interfaces:**
- Produces: `Route` gains `view: "course" | "module"`; `parseHash("")`, `parseHash("#/")` → `{view:"course", subjectId:null, stepIndex:null, mode:"lesson"}`; `parseHash("#/x/quiz")` and `"#/x/challenge"` → `mode:"challenge"`; `formatHash(id, "challenge", i)` → `#/<id>/quiz`; new `HOME_HASH = "#/"`.

- [ ] **Step 1: Failing tests** `empty and #/ are the course page`, `quiz and challenge both open the practice check`, `formatHash writes quiz`
- [ ] **Step 2: Run** `npx vitest run src/core/route.test.ts` — Expected: FAIL
- [ ] **Step 3: Implement** in `route.ts`
- [ ] **Step 4: Run** same — Expected: PASS (existing route tests still pass)
- [ ] **Step 5: Commit** `feat(route): course home route and #/<id>/quiz`

### Task 3: Course overview and syllabus drawer

**Files:**
- Create: `src/components/CourseOverview.tsx`, `src/components/CourseOverview.test.tsx`
- Create: `src/components/SyllabusDrawer.tsx`, `src/components/SyllabusDrawer.test.tsx`

**Interfaces:**
- Consumes: Task 1 functions, `trackGroups`, `moduleLabel`.
- Produces:
  - `CourseOverview({ subjects, progress, onOpenModule(id: string) })` — `<h1>` `COURSE.title`; progressbar `aria-label="Course completion"` with `aria-valuenow={percent}` and text `"<c> / 14 modules · <p>%"`; Resume button: `Start Module 01 →` when nothing done, else `Resume: <NN>. <title> →`, absent when `resumeTarget` is null or not built; one `<section aria-label={PART_TITLES[n]}>` per part with `"<c> / <t> modules completed"`; built modules are `<button>`s named by title showing status text `✓ Completed` / `▶ Up next` / `<seen>/<total> steps` / `<n> steps`, plus tags and `<min> min`; unbuilt are non-interactive cards with `Coming soon`.
  - `SyllabusDrawer({ open, subjects, progress, activeId: string | null, onClose(), onOpenModule(id), onHome() })` — `role="dialog"` `aria-label="Course syllabus"` `aria-modal`; a `group` per part; built modules as buttons with `aria-current="page"` for `activeId` and `✓`/`○`; unbuilt disabled with "Coming soon"; Escape and backdrop click call `onClose`; button `← Course overview` calls `onHome`. Renders nothing when `open` is false.

- [ ] **Step 1: Failing tests**
  - CourseOverview: `shows 0 / 14 and Start Module 01 when new`; `marks complete, in progress and up next`; `shows coming soon for unbuilt modules without a button`; `Resume opens the up-next module` (calls `onOpenModule("02-…")` when 01 complete); `part counts`.
  - SyllabusDrawer: `lists 4 parts and 14 modules`; `highlights the active module`; `Escape closes`; `clicking a built module opens it`; `unbuilt modules are disabled`.
- [ ] **Step 2: Run** `npx vitest run src/components` — Expected: FAIL
- [ ] **Step 3: Implement** both components in the example's style
- [ ] **Step 4: Run** same — Expected: PASS
- [ ] **Step 5: Commit** `feat(shell): course overview page and syllabus drawer`

### Task 4: Player shell and app wiring

**Files:**
- Create: `src/components/AppHeader.tsx`, `src/components/UpNextCard.tsx`
- Modify: `src/App.tsx`, `src/components/StepControls.tsx`, `src/components/SplitWorkspace.tsx`, `src/components/ComingSoon.tsx`, `src/index.css`
- Delete: `src/components/TopNav.tsx`
- Test: `src/App.test.tsx`, `src/components/StepControls.test.tsx`, `src/smoke.test.tsx`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces:
  - `AppHeader({ view, subject?: SubjectModule, mode, progress, subjects, onHome(), onOpenSyllabus(), onModeChange(mode) })` — brand button `aria-label="ConceptForge home"` (→ `onHome`); `☰` button `aria-label="Open syllabus"`; breadcrumb `nav aria-label="Breadcrumb"`: course view `LLM Mastery`; module view `LLM Mastery` (button → home) / `<NN>. <title>`; module view tabs `role="tab"`: `Guided Steps`, `Practice Check <quizBadge>`; course view pill `Mastered <completed>/14`.
  - `UpNextCard({ subject, isBuilt, onOpenModule, onHome })` — label `Up next in syllabus`; next built → `<NN>. <title>` and button `Next module →`; next unbuilt → `<NN>. <title> · coming soon` with no button; no next → `Course complete` and button `Course overview →`.
  - `StepControls` new prop `onFinishSteps(): void`: on the last step the Next button becomes `Take Practice Check ✓` (enabled) and calls it; step dots become a segmented bar (segments filled up to and including `index`, still grouped by section, same `Go to step N: <title>` labels and `aria-current`).
  - `ComingSoon` gets `onHome` and a `Back to course overview` button (replaces "menu above" text).
  - `App`: `view` state from `parseHash`; course view renders `CourseOverview`; module view renders player plus `UpNextCard` under the left pane (and under the practice check); `SyllabusDrawer` toggled from the header; opening any module/home stops Auto-Play and closes the drawer; keyboard shortcuts only when `view === "module" && mode === "lesson"`; hash `#/` written for the course view; `hashchange` updates `view`.
  - Stage panel: `SplitWorkspace` wraps `children` in a panel with a mono header `Interactive stage · <shortTitle>` and a `.stage-grid` body; `main` keeps `aria-label="Interactive stage"`.

- [ ] **Step 1: Failing tests** in `App.test.tsx` (replace the menu test and the "starts on first subject" / "falls back" tests):
  - `starts on the course overview` (no hash → heading `LLM Mastery`, `0 / 14`)
  - `Start Module 01 opens step 1 and writes the hash`
  - `breadcrumb LLM Mastery returns to the course overview` → hash `#/`
  - `back to #/ shows the course overview` (set hash, dispatch `hashchange`)
  - `shortcuts are off on the course page` (ArrowRight on overview → still overview, no progress written)
  - `going home stops auto-play` (fake timers: start Auto-Play, click home, advance timer, reopen module → step unchanged)
  - `last step offers the practice check` → click `Take Practice Check ✓` → tab `Practice Check` selected, hash `#/<id>/quiz`
  - `up next card opens the next built module at step 1`
  - `syllabus drawer opens and switches module`
  - `a deleted subject in the hash shows the course overview`
  - `coming-soon page has a way back`
  - keep the existing legacy-link, coming-soon, key-takeaway, arrow-key, Space, text-field tests
  - `StepControls.test`: `last step shows Take Practice Check` calling `onFinishSteps`; segments filled up to index
  - `smoke.test`: last step expects button `Take Practice Check ✓` instead of a disabled Next
- [ ] **Step 2: Run** `npx vitest run src/App.test.tsx src/components src/smoke.test.tsx` — Expected: FAIL
- [ ] **Step 3: Implement** the components, App wiring, `.stage-grid` and range-slider CSS from the example; delete `TopNav.tsx`
- [ ] **Step 4: Run** `npm run typecheck && npm run test` — Expected: all pass
- [ ] **Step 5: Commit** `feat(shell): course-style player, header, up-next card; drop dropdown menu`

### Task 5: Docs and milestone verification

**Files:** Modify `README.md`, `CLAUDE.md` (shell description, routes), `scripts/create-subject.mjs` only if it references TopNav

- [ ] **Step 1:** `grep -rn "TopNav\|dropdown\|menu above\|Choose a module" src scripts README.md CLAUDE.md docs/*.md` — update every hit describing the old shell
- [ ] **Step 2: Run** `npm run typecheck && npm run test && BASE_PATH=/ConceptForge/ npm run build` — Expected: clean, all tests pass, build succeeds
- [ ] **Step 3: Browser pass** (headless Chromium on `vite preview` under `/ConceptForge/`): overview → Start → step through Module 01 → Take Practice Check → Up next → drawer → home; reload keeps progress; back/forward; 390 px width with no horizontal scroll; no console errors
- [ ] **Step 4: Commit** `docs: describe the course shell`
