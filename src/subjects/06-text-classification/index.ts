import { Tags } from "lucide-react";
import { PART_TITLES } from "../../core/track";
import { lazyStage } from "../../core/lazyStage";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "06-text-classification",
  title: "Text Classification",
  shortTitle: "Classification",
  tagline: "Route bank tickets three ways: a trained head, zero-shot embeddings, and prompting gemma4.",
  category: PART_TITLES[2],
  part: 2,
  moduleNumber: 6,
  bridge: {
    buildsOn: "Module 01's representation vs generative models, Module 02's sentence embeddings and Module 03's next-token probabilities, now put to work on a real task.",
    leadsTo: "Module 07 drops the labels: clustering the same kind of vectors to discover what topics exist.",
  },
  difficulty: "intermediate",
  estimatedMinutes: 45,
  icon: Tags,
  accent: "sky",
  steps,
  challenges,
  Stage: lazyStage(() => import("./Stage")),
};

export default subject;
