import { MessageSquareCode } from "lucide-react";
import { PART_TITLES } from "../../core/track";
import { lazyStage } from "../../core/lazyStage";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "08-prompt-engineering",
  title: "Prompt Engineering",
  shortTitle: "Prompting",
  tagline: "Roles, examples, step-by-step reasoning and JSON schemas, measured on 512 real gemma4 runs.",
  category: PART_TITLES[2],
  part: 2,
  moduleNumber: 8,
  bridge: {
    buildsOn: "Module 06's classification prompt and Module 07's topic-naming prompt, plus Module 04's decoding and token probabilities.",
    leadsTo: "Module 09 grounds answers in your own documents: semantic search and retrieval-augmented generation (RAG), with citations.",
  },
  difficulty: "intermediate",
  estimatedMinutes: 50,
  icon: MessageSquareCode,
  accent: "amber",
  steps,
  challenges,
  Stage: lazyStage(() => import("./Stage")),
};

export default subject;
