import { Scissors } from "lucide-react";
import type { SubjectModule } from "../../core/types";
import { challenges } from "./challenges";
import { Stage } from "./Stage";
import { steps } from "./steps";

const subject: SubjectModule = {
  id: "tokenization",
  title: "Tokenization",
  shortTitle: "Tokenization",
  tagline: "How text becomes numbers: BPE, WordPiece, SentencePiece, special tokens and real GPT tokenizers.",
  category: "Stage 1 · Text-to-Number Foundations",
  difficulty: "beginner",
  estimatedMinutes: 45,
  icon: Scissors,
  accent: "sky",
  steps,
  challenges,
  Stage,
};

export default subject;
