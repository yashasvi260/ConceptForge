import { Shapes } from "lucide-react";
import { PART_TITLES } from "../../core/track";
import { lazyStage } from "../../core/lazyStage";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "07-clustering-topics",
  title: "Text Clustering and Topic Modeling",
  shortTitle: "Clustering & topics",
  tagline: "Discover what customers talk about: embeddings → UMAP → HDBSCAN → c-TF-IDF, with topic names from gemma4.",
  category: PART_TITLES[2],
  part: 2,
  moduleNumber: 7,
  bridge: {
    buildsOn: "Module 06's sentence vectors, used without any labels, and Module 02's cosine similarity.",
    leadsTo: "Module 08 turns to the prompt itself: how wording, examples, reasoning and structure change an LLM's answers.",
  },
  difficulty: "intermediate",
  estimatedMinutes: 45,
  icon: Shapes,
  accent: "emerald",
  steps,
  challenges,
  Stage: lazyStage(() => import("./Stage")),
};

export default subject;
