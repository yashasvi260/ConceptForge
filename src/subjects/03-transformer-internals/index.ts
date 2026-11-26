import { Cpu } from "lucide-react";
import { lazyStage } from "../../core/lazyStage";
import { PART_TITLES } from "../../core/track";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "03-transformer-internals",
  title: "Inside the Transformer Block",
  shortTitle: "Transformer Block",
  tagline: "The forward pass: positions, attention, multi-head and GQA, normalisation and the feed-forward network.",
  category: PART_TITLES[1],
  part: 1,
  moduleNumber: 3,
  bridge: {
    buildsOn: "Module 02's token vectors. Here you follow them through the transformer, block by block, until they become the next token.",
    leadsTo: "Module 04 turns the last vector into the next token (logits, decoding, the KV cache), and Module 05 shows how the weights were learned. Then Part II puts these models to work.",
  },
  difficulty: "intermediate",
  estimatedMinutes: 45,
  icon: Cpu,
  accent: "emerald",
  steps,
  challenges,
  loadDeep: () => import("./deep").then((m) => m.content),
  Stage: lazyStage(() => import("./Stage")),
};

export default subject;
