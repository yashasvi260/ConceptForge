import { MessageSquareCode } from "lucide-react";
import { PART_TITLES } from "../../core/track";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { Stage } from "./Stage";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "06-prompt-engineering",
  title: "Prompt Engineering",
  shortTitle: "Prompting",
  tagline: "Roles, examples, step-by-step reasoning and JSON schemas, measured on 512 real gemma4 runs.",
  category: PART_TITLES[2],
  part: 2,
  moduleNumber: 6,
  bridge: {
    buildsOn: "Module 04's classification prompt and Module 05's topic-naming prompt, plus Module 03's decoding and token probabilities.",
    leadsTo: "Module 07 adds memory, smaller (quantized) models and tools: LLMs that act in a loop, not just answer once.",
  },
  difficulty: "intermediate",
  estimatedMinutes: 50,
  icon: MessageSquareCode,
  accent: "amber",
  steps,
  challenges,
  Stage,
};

export default subject;
