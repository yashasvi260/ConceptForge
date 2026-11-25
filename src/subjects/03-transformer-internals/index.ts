import { Cpu } from "lucide-react";
import { PART_TITLES } from "../../core/track";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { Stage } from "./Stage";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "03-transformer-internals",
  title: "Looking Inside Large Language Models",
  shortTitle: "Inside LLMs",
  tagline: "The forward pass: positions, attention, GQA, normalisation, feed-forward, decoding and the KV cache.",
  category: PART_TITLES[1],
  part: 1,
  moduleNumber: 3,
  bridge: {
    buildsOn: "Module 02's token vectors. Here you follow them through the transformer, block by block, until they become the next token.",
    leadsTo: "Part I is complete. Module 04 starts Part II by putting these models to work: classifying text three different ways.",
  },
  difficulty: "intermediate",
  estimatedMinutes: 60,
  icon: Cpu,
  accent: "emerald",
  steps,
  challenges,
  Stage,
};

export default subject;
