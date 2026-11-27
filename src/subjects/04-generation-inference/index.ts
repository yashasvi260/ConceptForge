import { Sparkles } from "lucide-react";
import { lazyStage } from "../../core/lazyStage";
import { PART_TITLES } from "../../core/track";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "04-generation-inference",
  title: "How LLMs Generate",
  shortTitle: "Generation",
  tagline: "From the last vector to the next token: logits, decoding rules, the generation loop, the KV cache and long context.",
  category: PART_TITLES[1],
  part: 1,
  moduleNumber: 4,
  bridge: {
    buildsOn: "Module 03's transformer block. Its last vector is where generation starts.",
    leadsTo: "Module 05 shows how the weights behind the logits were learned. Then Part II puts these models to work.",
  },
  difficulty: "intermediate",
  estimatedMinutes: 20,
  icon: Sparkles,
  accent: "violet",
  steps,
  challenges,
  loadDeep: () => import("./deep").then((m) => m.content),
  Stage: lazyStage(() => import("./Stage")),
};

export default subject;
