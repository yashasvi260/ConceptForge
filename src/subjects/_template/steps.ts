import type { LessonStep } from "../../core/types";

export const steps: LessonStep[] = [
  {
    id: "intro",
    title: "The big picture",
    summary: "One sentence that captures the idea of this step.",
    body: [
      "Explain the concept in two or three short paragraphs. Use `inline code` for terms.",
      "Point at what the learner should notice in the interactive stage.",
    ],
    tryIt: "Move the `Intensity` slider and watch the bar respond.",
    keyTakeaway: "The one sentence a learner should remember from this step.",
    view: "intro",
  },
  {
    id: "deeper",
    title: "Going deeper",
    summary: "Build on the previous step.",
    body: ["Each step picks a `view`; the Stage decides what to render for it."],
    view: "deeper",
  },
];
