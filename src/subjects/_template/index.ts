import { Sparkles } from "lucide-react";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { Stage } from "./Stage";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "my-subject",
  title: "My Subject",
  shortTitle: "My Subject",
  tagline: "One line on what learners will understand by the end.",
  category: "Part I · Understanding Language Models",
  part: 1,
  moduleNumber: 99,
  bridge: {
    buildsOn: "What the learner already knows from the previous module.",
    leadsTo: "What this module hands to the next one, and why it matters.",
  },
  difficulty: "beginner",
  estimatedMinutes: 15,
  icon: Sparkles,
  accent: "violet",
  steps,
  challenges,
  Stage,
};

export default subject;
