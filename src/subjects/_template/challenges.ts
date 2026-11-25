import type { ChallengeItem } from "../../core/types";

export const challenges: ChallengeItem[] = [
  {
    id: "q1",
    prompt: "What decides which visual the Stage shows?",
    options: ["The step's `view` key", "The step's title", "A random choice"],
    correctIndex: 0,
    explanation: "Stages switch on `step.view`, so steps can share or swap visuals freely.",
    relatedStepId: "deeper",
    hint: "Look at what each step object contains.",
  },
];
