import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { StageProps } from "../../core/types";
import { tokenizeWords } from "./attention";
import { AttentionView, MultiHeadView, QkvView, type AttentionState } from "./views/AttentionViews";
import { FfnView, ForwardView, GqaView, NormView, PositionalView, RecapView } from "./views/InternalsViews";
import { BlockParamsLab, LearnedPosLab, RopeRelativeLab, ShapesLab, ShuffleLab } from "./views/labs/ForwardPositionLabs";

export function Stage({ step }: StageProps) {
  const [text, setText] = useState("The bank approved the loan");
  const [focus, setFocus] = useState(1);
  const [head, setHead] = useState(1);
  const [causal, setCausal] = useState(true);
  const tokens = tokenizeWords(text);
  const s: AttentionState = { text, setText, tokens, focus: Math.min(focus, Math.max(0, tokens.length - 1)), setFocus, head, setHead, causal, setCausal };

  const view = (() => {
    if (tokens.length === 0 && ["qkv", "attention", "multihead"].includes(step.view)) {
      return <p className="text-sm text-slate-500">Type a sentence to see attention.</p>;
    }
    switch (step.view) {
      case "forward":
        return <ForwardView />;
      case "positional":
        return <PositionalView />;
      case "qkv":
        return <QkvView s={s} />;
      case "attention":
        return <AttentionView s={s} />;
      case "multihead":
        return <MultiHeadView s={s} />;
      case "gqa":
        return <GqaView />;
      case "norm":
        return <NormView />;
      case "ffn":
        return <FfnView />;
      case "shapes":
        return <ShapesLab />;
      case "block-params":
        return <BlockParamsLab />;
      case "shuffle":
        return <ShuffleLab />;
      case "learned-pos":
        return <LearnedPosLab />;
      case "rope-relative":
        return <RopeRelativeLab />;
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
