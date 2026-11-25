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
}

export type PlayerMode = "lesson" | "challenge";
