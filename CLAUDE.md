# CLAUDE.md — Multi-Subject Interactive Visual Learning Platform

## Project Overview
Build **ConceptForge** (a multi-subject interactive visual learning web application inspired by *Designed to Scale*). It serves as a reusable platform for interactive, step-by-step animated lessons across **multiple subjects**—starting with a **Subject Registry** and **Universal Lesson Player** that supports any domain module (e.g., Distributed Systems, LLM & Transformer Internals, Data & Lakehouse Architecture, Math & Geometry, or Custom Topics).

## Tech Stack & Environment
- **Runtime:** WSL2 (Ubuntu) on Windows 11, Node.js 20+, TypeScript 5+ (strict mode)
- **Frontend:** React 18 + Vite + TypeScript
- **Styling & Icons:** Tailwind CSS + `lucide-react`
- **Motion & Diagrams:** `framer-motion` + custom SVG canvas / interactive widgets
- **Testing:** Vitest + React Testing Library

## Core Design Principle: Universal Shell + Pluggable Subject Modules
Never hardcode a single subject into the layout, navigation, step scrubber, or quiz engine. Every subject plugs into a common contract (`SubjectModule`) with:
1. **Metadata:** `id`, `title`, `tagline`, `category`, `difficulty`, `estimatedMinutes`, `accentColor`.
2. **Step Sequence (`LessonStep[]`):** Each step has `id`, `stepNumber`, `title`, `narrative`, `keyTakeaway`, `calloutFormulaOrMetric`, `activeStageIds`, and `controlsState`.
3. **Pluggable Interactive Stage (`renderStage`):** Renders a custom interactive simulator/diagram for that subject and responds to the current step, user parameter tweaks, and scenario/failure modes.
4. **Practice / Challenge Set (`ChallengeItem[]`):** Scenario-based checks or parameter-tuning tasks tied to the subject's concepts.

> **As implemented** (`src/core/types.ts`): metadata uses `accent` (not `accentColor`); steps use `summary`, `body` (the narrative), `tryIt`, optional `keyTakeaway`, and `view` (which visual the Stage draws) instead of `stepNumber`/`activeStageIds`/`controlsState`; the stage is a `Stage` component (`Stage.tsx`), not a `renderStage` function; challenges have an optional `hint`. Components live flat in `src/components/`. Part II (Modules 04–06): generated text is never hand-written — it is recorded from real models via local Ollama (`scripts/record-generations.mjs` + `scripts/recordings/*.mjs`, fixtures in each module's `data/recordings/`, shape `RecordingFile` in `src/llm/recordings.ts`) and shown with `GenerationPanel` (provenance label, "No recording for this setting", opt-in "Connect my Ollama" live mode that never fetches before a click). Claims in lesson text about recordings are pinned by tests (e.g. `06-prompt-engineering/claims.test.ts`). The shell (see `docs/superpowers/specs/2026-11-25-course-shell-design.md`): `#/` is the course overview (`CourseOverview`: completion, Resume, Parts and module cards), the player has `AppHeader` (breadcrumbs, Guided Steps / Practice Check tabs), a `SyllabusDrawer` instead of a dropdown, and an `UpNextCard`; completion maths live in `src/core/courseProgress.ts` (a module is complete when every step is viewed and its practice check attempted).

## Recommended Directory Structure
```text
src/
├── core/
│   ├── types.ts                 # SubjectModule, LessonStep, ChallengeItem, StageProps
│   ├── registry.ts              # Central registry of all subjects + lookup helpers
│   └── storage.ts               # LocalStorage progress tracking (completed steps, quiz scores, custom notes)
├── components/
│   ├── shell/
│   │   ├── AppHeader.tsx        # Breadcrumbs, Guided Steps | Practice Check tabs, Mastered x/14 (+ SyllabusDrawer, CourseOverview, UpNextCard)
│   │   ├── StepControls.tsx     # Prev/Next step, Auto-Play toggle, speed selector, keyboard shortcuts (← / → / Space)
│   │   └── SplitWorkspace.tsx   # Responsive desktop split-pane (left: step story & controls; right: live interactive stage)
│   └── practice/
│       └── ChallengeRunner.tsx  # Reusable interactive challenge & quiz engine with hints and explanations
├── subjects/
│   ├── _template/               # Copy-pasteable boilerplate for adding ANY new subject in minutes
│   │   ├── index.ts
│   │   ├── steps.ts
│   │   ├── challenges.ts
│   │   └── StageView.tsx
│   ├── 01-intro-llms/ … 14-evals-guardrails/   # LLM Mastery modules (ids from docs/curriculum.md; see src/core/track.ts)
│   └── 02-tokens-embeddings/    # Module 02 (Tokens section = former Tokenization topic)
└── App.tsx