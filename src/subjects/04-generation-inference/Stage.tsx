import { AnimatePresence, motion } from "framer-motion";
import type { StageProps } from "../../core/types";
import { KvCacheView, LogitsView, RecapView, SamplingView } from "./views/GenerationViews";

export function Stage({ step }: StageProps) {
  const view = (() => {
    switch (step.view) {
      case "logits":
        return <LogitsView />;
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
