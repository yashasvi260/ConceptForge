import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type Difficulty = "beginner" | "intermediate" | "advanced";

/** Accent palette a subject can pick; class names live in `accent.ts`. */
export type AccentColor = "sky" | "emerald" | "amber" | "violet" | "rose";

/** One guided step of a lesson: narrative on the left, interactive stage on the right. */
export interface LessonStep {
  /** Stable id, unique within the subject (used for progress + challenge links). */
  id: string;
  title: string;
  /** One-sentence takeaway shown under the title. */
  summary: string;
  /** Explanation paragraphs. Inline `code` is rendered with backticks. */
  body: string[];
  /** Optional nudge pointing at the interactive controls for this step. */
  tryIt?: string;
  /** Key the subject's Stage uses to choose which visual to render for this step. */
  view: string;
  /** One-line "remember this" callout shown under the explanation. */
  keyTakeaway?: string;
  /** Groups steps in the scrubber (e.g. "Tokens", "Embeddings"). */
  section?: string;
  /** Formula or metric shown in a monospace callout (e.g. "softmax(QKᵀ/√d)·V"). */
  callout?: string;
  /** Six-section deep lesson; when present the player renders a scrolling lesson page. */
  deep?: DeepLesson;
}

export type WorkedBlock =
  | { kind: "text"; text: string }
  | { kind: "math"; text: string }
  /** `source` is a worked/*.py script whose printed JSON equals `rows` (checked in tests). */
  | { kind: "table"; caption: string; columns: string[]; rows: (string | number)[][]; source: string };

export interface Formula {
  expr: string;
  symbols: { sym: string; meaning: string }[];
  example: string;
}

export interface ConceptPart {
  heading: string;
  paragraphs: string[];
  formula?: Formula;
  mistake?: string;
}

export interface ExercisePart {
  id: string;
  prompt: string;
  starter: string;
  solution: string;
  /** Python defining `check_*(ns)` functions. */
  checks: string;
  hints: string[];
}

export interface Exercise {
  id: string;
  title: string;
  packages: "numpy"[];
  /** Key into the subject's precomputed data, injected into Python as `DATA`. */
  data?: string;
  parts: ExercisePart[];
}

export interface LocalListing {
  id: string;
  title: string;
  install: string;
  code: string;
  /** Captured from a real run (scripts/capture-local-outputs.mjs). */
  output: string;
}

export interface SourceLink {
  label: string;
  url: string;
  adds: string;
}

export interface DeepLesson {
  why: string[];
  worked: WorkedBlock[];
  concept: ConceptPart[];
  /** "Predict → change it → explain" task shown above the interactive view. */
  guided: string;
  build: Exercise;
  local: LocalListing[];
  checks: ChallengeItem[];
  oneSentence: string;
  deeper: SourceLink[];
}

/** Props every subject Stage receives from the lesson player. */
export interface StageProps {
  step: LessonStep;
  stepIndex: number;
}

/** A single multiple-choice question run by the ChallengeRunner. */
export interface ChallengeItem {
  id: string;
  prompt: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
  /** Shown after the learner checks their answer. */
  explanation: string;
  /** Step to revisit if the learner gets it wrong. */
  relatedStepId?: string;
  /** Optional nudge the learner can reveal before answering. */
  hint?: string;
}

/** A self-contained subject plugged into the platform via `registry.ts`. */
export interface SubjectModule {
  /** URL-safe kebab-case id, e.g. `transformers`. */
  id: string;
  title: string;
  /** Compact label for the subject switcher. */
  shortTitle: string;
  tagline: string;
  /** Curriculum part title (see PART_TITLES). */
  category: string;
  /** Curriculum part (I–IV) and module number (1–14); see src/core/track.ts. */
  part: 1 | 2 | 3 | 4;
  moduleNumber: number;
  /** How this module connects to the rest of the track, in plain language. */
  bridge: { buildsOn: string; leadsTo: string };
  difficulty: Difficulty;
  estimatedMinutes: number;
  icon: LucideIcon;
  accent: AccentColor;
  steps: LessonStep[];
  challenges: ChallengeItem[];
  /**
   * The interactive visual. Mounted once per subject and kept mounted while the learner
   * steps through the lesson, so control state (sliders, toggles) survives step changes.
   */
  Stage: ComponentType<StageProps>;
  /** Precomputed data for deep-lesson exercises, keyed by `Exercise.data`. */
  deepData?: Record<string, unknown>;
}

export type PlayerMode = "lesson" | "challenge";
