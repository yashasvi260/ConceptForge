import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { StageProps } from "../../core/types";
import { AttentionLab, LogitsLab, NormResidualLab, PositionLab, TokenLookupLab } from "./views/AnatomyLabs";
import { AnatomyView } from "./views/AnatomyView";
import { ArchView } from "./views/ArchView";
import { BigramLab, GuessNextLab, NextTokenTasksLab, TemperatureLab } from "./views/BigPictureLabs";
import { BowView } from "./views/BowView";
import { ContextView } from "./views/ContextView";
import { DenseView } from "./views/DenseView";
import { EncDecView } from "./views/EncDecView";
import { GenerationLabView } from "./views/GenerationLabView";
import { MapView } from "./views/MapView";
import { RecapView } from "./views/RecapView";
import { RepGenView } from "./views/RepGenView";
import { ScaleView } from "./views/ScaleView";
import { TrainingView } from "./views/TrainingView";
import { TrainUseView } from "./views/TrainUseView";

export const DEFAULT_SENTENCES = ["The film was great", "The movie was excellent", "Interest rates rose today", "Dog bites man", "Man bites dog"].join("\n");

export function Stage({ step }: StageProps) {
  const [sentences, setSentences] = useState(DEFAULT_SENTENCES);
  const view = (() => {
    switch (step.view) {
      case "loop-lab":
        return <GenerationLabView />;
      case "guess-next":
        return <GuessNextLab />;
      case "temperature":
        return <TemperatureLab />;
      case "bigram":
        return <BigramLab />;
      case "next-token-tasks":
        return <NextTokenTasksLab />;
      case "map":
        return <MapView />;
      case "anatomy":
        return <AnatomyView />;
      case "token-lookup":
        return <TokenLookupLab />;
      case "positions":
        return <PositionLab />;
      case "attention":
        return <AttentionLab />;
      case "norm-residual":
        return <NormResidualLab />;
      case "logits":
        return <LogitsLab />;
      case "scale":
        return <ScaleView />;
      case "trainuse":
        return <TrainUseView />;
      case "bow":
        return <BowView text={sentences} setText={setSentences} />;
      case "dense":
        return <DenseView text={sentences} setText={setSentences} />;
      case "context":
        return <ContextView />;
      case "arch":
        return <ArchView />;
      case "encdec":
        return <EncDecView />;
      case "repgen":
        return <RepGenView />;
      case "training":
        return <TrainingView />;
      case "recap":
        return <RecapView />;
      default:
        return null;
    }
  })();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={step.view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="min-w-0 space-y-4">
        {view}
      </motion.div>
    </AnimatePresence>
  );
}
