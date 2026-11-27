import { AnimatePresence, motion } from "framer-motion";
import type { StageProps } from "../../core/types";
import { KvCacheView, RecapView, SamplingView } from "./views/GenerationViews";
import { BeamLab, GreedyLoopLab, TempSamplesLab, TemperatureLab } from "./views/labs/DecodingLabs";
import { EveryPositionLab, LmHeadLab, RealNextLab, SoftmaxShiftLab } from "./views/labs/LogitsLabs";

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
      case "sampling":
        return <SamplingView />;
      case "kvcache":
        return <KvCacheView />;
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
