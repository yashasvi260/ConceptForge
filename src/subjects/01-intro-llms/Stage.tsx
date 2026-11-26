import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { StageProps } from "../../core/types";
import { AttentionLab, LogitsLab, NormResidualLab, PositionLab, TokenLookupLab } from "./views/AnatomyLabs";
import { AnatomyView } from "./views/AnatomyView";
import { FamiliesLab, FamilySizesLab, ModelCardLab, ObjectiveLab, TaskFramingLab } from "./views/ArchLabs";
import { ArchView } from "./views/ArchView";
import { BigramLab, GuessNextLab, NextTokenTasksLab, TemperatureLab } from "./views/BigPictureLabs";
import { BridgeLab, CosineLab, KeywordWinsLab, TfIdfLab, WordOrderLab } from "./views/BowLabs";
import { BowView } from "./views/BowView";
import { BankMatrixLab, ContextMixLab, ContextReachLab, SenseByExampleLab, TokenSentenceLab } from "./views/ContextLabs";
import { ContextView } from "./views/ContextView";
import { ContrastiveLab, DenseSparseLab, EmbedVsLlmLab, NeighboursLab, PoolingLossLab } from "./views/DenseLabs";
import { DenseView } from "./views/DenseView";
import { CrossAttentionLab, DecoderOnlyLab, EncDecCostLab, T5RunLab, TeacherForcingLab, TwoStacksLab } from "./views/EncDecLabs";
import { EncDecView } from "./views/EncDecView";
import { GenerationLabView } from "./views/GenerationLabView";
import { DataVsSizeLab, MemoryLab, NeuronLab, ParamCalcLab } from "./views/HowLargeLabs";
import { MapView } from "./views/MapView";
import { RecapView } from "./views/RecapView";
import { RepGenView } from "./views/RepGenView";
import { ScaleView } from "./views/ScaleView";
import { TrainingView } from "./views/TrainingView";
import { ComputeLab, FrozenLab, GradientLab, LossLab } from "./views/TrainUseLabs";
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
      case "neuron":
        return <NeuronLab />;
      case "param-calc":
        return <ParamCalcLab />;
      case "data-vs-size":
        return <DataVsSizeLab />;
      case "memory":
        return <MemoryLab />;
      case "trainuse":
        return <TrainUseView />;
      case "loss":
        return <LossLab />;
      case "gradient":
        return <GradientLab />;
      case "frozen":
        return <FrozenLab />;
      case "compute":
        return <ComputeLab />;
      case "bow":
        return <BowView text={sentences} setText={setSentences} />;
      case "cosine":
        return <CosineLab />;
      case "word-order":
        return <WordOrderLab />;
      case "tfidf":
        return <TfIdfLab />;
      case "keyword-wins":
        return <KeywordWinsLab />;
      case "bridge":
        return <BridgeLab />;
      case "dense":
        return <DenseView text={sentences} setText={setSentences} />;
      case "dense-vs-sparse":
        return <DenseSparseLab />;
      case "contrastive":
        return <ContrastiveLab />;
      case "neighbours":
        return <NeighboursLab />;
      case "pooling-loses":
        return <PoolingLossLab />;
      case "embed-vs-llm":
        return <EmbedVsLlmLab />;
      case "context":
        return <ContextView />;
      case "bank-matrix":
        return <BankMatrixLab />;
      case "context-mix":
        return <ContextMixLab />;
      case "context-reach":
        return <ContextReachLab />;
      case "token-sentence":
        return <TokenSentenceLab />;
      case "sense-by-example":
        return <SenseByExampleLab />;
      case "arch":
        return <ArchView />;
      case "families":
        return <FamiliesLab />;
      case "objectives":
        return <ObjectiveLab />;
      case "task-framing":
        return <TaskFramingLab />;
      case "family-sizes":
        return <FamilySizesLab />;
      case "model-card":
        return <ModelCardLab />;
      case "encdec":
        return <EncDecView />;
      case "two-stacks":
        return <TwoStacksLab />;
      case "cross-attention":
        return <CrossAttentionLab />;
      case "teacher-forcing":
        return <TeacherForcingLab />;
      case "encdec-cost":
        return <EncDecCostLab />;
      case "decoder-only":
        return <DecoderOnlyLab />;
      case "t5-run":
        return <T5RunLab />;
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
