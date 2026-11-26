import { Map as MapIcon } from "lucide-react";
import { PART_TITLES } from "../../core/track";
import { lazyStage } from "../../core/lazyStage";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "01-intro-llms",
  title: "Introduction to Language Models",
  shortTitle: "Intro to LLMs",
  tagline: "The big picture: how an LLM turns text into predictions, the model families, and how they're trained.",
  category: PART_TITLES[1],
  part: 1,
  moduleNumber: 1,
  bridge: {
    buildsOn: "Nothing but curiosity: this is the starting point, the map every other module plugs into.",
    leadsTo: "Module 02 zooms into the first link of the loop: how text is chopped into tokens and how each token becomes a vector.",
  },
  difficulty: "beginner",
  estimatedMinutes: 30,
  icon: MapIcon,
  accent: "violet",
  steps,
  challenges,
  Stage: lazyStage(() => import("./Stage")),
  // Lesson text, exercises and MiniLM data download only when a deep step is opened.
  loadDeep: () => import("./deep").then((m) => m.content),
};

export default subject;
