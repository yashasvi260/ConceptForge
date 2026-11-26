import { Scissors } from "lucide-react";
import { PART_TITLES } from "../../core/track";
import { lazyStage } from "../../core/lazyStage";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "02-tokens-embeddings",
  title: "Tokens and Embeddings",
  shortTitle: "Tokens & Embeddings",
  tagline: "How text becomes token IDs, and how IDs become meaningful vectors.",
  category: PART_TITLES[1],
  part: 1,
  moduleNumber: 2,
  bridge: {
    buildsOn: "Module 01's big picture: a model only ever works with numbers. Here you see exactly how text gets turned into them.",
    leadsTo: "You now have one vector per token. Module 03 opens the transformer to show how those vectors are mixed, layer by layer, into a prediction of the next token.",
  },
  difficulty: "beginner",
  estimatedMinutes: 60,
  icon: Scissors,
  accent: "sky",
  steps,
  challenges,
  loadDeep: () => import("./deep").then((m) => m.content),
  Stage: lazyStage(() => import("./Stage")),
};

export default subject;
