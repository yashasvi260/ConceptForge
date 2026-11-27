import { AnimatePresence, motion } from "framer-motion";
import type { StageProps } from "../../core/types";
import { KvCacheView, RecapView } from "./views/GenerationViews";
import { BeamLab, GreedyLoopLab, TempSamplesLab, TemperatureLab } from "./views/labs/DecodingLabs";
import { KvEqualLab, KvMemoryLab, KvShapesLab } from "./views/labs/KvCacheLabs";
import { CtxCostLab, LossByContextLab, PositionLimitLab, SlidingWindowLab } from "./views/labs/LongContextLabs";
import { EveryPositionLab, LmHeadLab, RealNextLab, SoftmaxShiftLab } from "./views/labs/LogitsLabs";
import { LoopStepsLab, PrefillDecodeLab, RepetitionLab, StopRulesLab } from "./views/labs/LoopLabs";
import { NucleusLab, SamplerChainLab, TailMassLab, TopKFixedLab } from "./views/labs/TruncationLabs";

export function Stage({ step }: StageProps) {
  const view = (() => {
    switch (step.view) {
      case "lm-head":
        return <LmHeadLab />;
      case "softmax-shift":
        return <SoftmaxShiftLab />;
      case "real-next":
        return <RealNextLab />;
      case "every-position":
        return <EveryPositionLab />;
      case "greedy-loop":
        return <GreedyLoopLab />;
      case "temperature":
        return <TemperatureLab />;
      case "temp-samples":
        return <TempSamplesLab />;
      case "beam":
        return <BeamLab />;
      case "tail-mass":
        return <TailMassLab />;
      case "topk-fixed":
        return <TopKFixedLab />;
      case "nucleus":
        return <NucleusLab />;
      case "sampler-chain":
        return <SamplerChainLab />;
      case "loop-steps":
        return <LoopStepsLab />;
      case "stop-rules":
        return <StopRulesLab />;
      case "prefill-decode":
        return <PrefillDecodeLab />;
      case "repetition":
        return <RepetitionLab />;
      case "kvcache":
        return <KvCacheView />;
      case "kv-shapes":
        return <KvShapesLab />;
      case "kv-equal":
        return <KvEqualLab />;
      case "kv-memory":
        return <KvMemoryLab />;
      case "ctx-cost":
        return <CtxCostLab />;
      case "loss-by-context":
        return <LossByContextLab />;
      case "position-limit":
        return <PositionLimitLab />;
      case "sliding-window":
        return <SlidingWindowLab />;
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
