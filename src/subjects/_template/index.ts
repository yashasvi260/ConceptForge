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
  category: "Stage 0 · Unsorted",
  difficulty: "beginner",
  estimatedMinutes: 15,
  icon: Sparkles,
  accent: "violet",
  steps,
  challenges,
  Stage,
};

export default subject;
