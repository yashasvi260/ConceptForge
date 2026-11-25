import type { ChallengeItem } from "../../core/types";

export const challenges: ChallengeItem[] = [
  {
    id: "head-frozen",
    prompt: "In “embedding + classification head”, which weights are trained?",
    options: ["All 22.7 million MiniLM weights", "Only the small head on top (here 1,925 weights)", "None: it's zero-shot", "Only the tokenizer"],
    correctIndex: 1,
    hint: "What stays frozen?",
    explanation: "The encoder stays frozen and only the head learns, which is why it trains in under a second on 40 examples. Updating the encoder too is fine-tuning (Module 11).",
    relatedStepId: "task-head",
  },
  {
    id: "held-out",
    prompt: "Why do we measure accuracy on the 20 held-out tickets rather than the 40 training tickets?",
    options: ["They are easier", "A model can memorise its training data; held-out tickets show how it does on new messages", "Training tickets have no labels", "It's faster"],
    correctIndex: 1,
    hint: "Which tickets did the model never see?",
    explanation: "Accuracy on data the model trained on overstates real performance. Held-out data is the honest test.",
    relatedStepId: "train-head",
  },
  {
    id: "zero-shot-new-label",
    prompt: "The bank adds a sixth category, “insurance”, and has no labelled examples yet. Which method can handle it today?",
    options: ["The trained head, unchanged", "Zero-shot: add one label description", "None of them", "Only a model trained from scratch"],
    correctIndex: 1,
    hint: "Which method needs only a description?",
    explanation: "Zero-shot just needs a description to embed (prompting works too: add the word to the prompt). The head would need examples and retraining.",
    relatedStepId: "zero-shot",
  },
  {
    id: "gen-confidence",
    prompt: "gemma4 answers “fraud” and its first token had probability 0.97. What does that 0.97 tell you?",
    options: [
      "The ticket is fraud with 97% certainty",
      "The model put 97% of its next-token probability on that token; whether that's calibrated must be measured",
      "97% of tickets are fraud",
      "The answer took 0.97 seconds",
    ],
    correctIndex: 1,
    hint: "Where does the number come from?",
    explanation: "It's the model's own token probability. Useful for routing, but a model can be confidently wrong, so calibration is checked on held-out data.",
    relatedStepId: "confidence",
  },
  {
    id: "cost-choice",
    prompt: "You must route 5 million tickets a day, you have 10,000 labelled examples, and the categories rarely change. Best first choice?",
    options: ["Prompt a large LLM for every ticket", "A classification head on a small encoder", "Zero-shot with one-word descriptions", "Manual routing"],
    correctIndex: 1,
    hint: "Lots of labels, huge volume, stable categories.",
    explanation: "With plenty of labels and high volume, a head is accurate, fast and almost free per ticket. An LLM could handle the uncertain few in a cascade.",
    relatedStepId: "choose",
  },
];
