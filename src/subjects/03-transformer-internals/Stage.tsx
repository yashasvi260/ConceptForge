import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { StageProps } from "../../core/types";
import { tokenizeWords } from "./attention";
import { AttentionView, MultiHeadView, QkvView, type AttentionState } from "./views/AttentionViews";
import { FfnView, ForwardView, GqaView, NormView, PositionalView, RecapView } from "./views/InternalsViews";
import { AttnCostLab, HeadFinderLab, QkvProjectLab, RealHeadsLab, SqrtDLab, ValueMixLab } from "./views/labs/AttentionLabs";
import { HeadAblationLab, HeadGridLab, HeadSplitLab, KvBudgetLab, KvRepeatLab, KvSharingLab } from "./views/labs/HeadsGqaLabs";
import { FfnActiveLab, FfnShapesLab, PrePostLab, ResidualDepthLab, StreamNormsLab, SwigluParamsLab } from "./views/labs/NormFfnLabs";
import { MoeBalanceLab, MoeMemoryLab, MoeParamsLab, MoeRouterLab } from "./views/labs/MoeLabs";
import { BlockCheckLab, BlockTraceLab, WeightNamesLab } from "./views/labs/RecapLabs";
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
      case "qkv-project":
        return <QkvProjectLab />;
      case "sqrt-d":
        return <SqrtDLab />;
      case "value-mix":
        return <ValueMixLab />;
      case "real-heads":
        return <RealHeadsLab />;
      case "head-finder":
        return <HeadFinderLab />;
      case "attn-cost":
        return <AttnCostLab />;
      case "head-split":
        return <HeadSplitLab />;
      case "head-grid":
        return <HeadGridLab />;
      case "head-ablation":
        return <HeadAblationLab />;
      case "kv-sharing":
        return <KvSharingLab />;
      case "kv-budget":
        return <KvBudgetLab />;
      case "kv-repeat":
        return <KvRepeatLab />;
      case "stream-norms":
        return <StreamNormsLab />;
      case "residual-depth":
        return <ResidualDepthLab />;
      case "pre-post":
        return <PrePostLab />;
      case "ffn-shapes":
        return <FfnShapesLab />;
      case "ffn-active":
        return <FfnActiveLab />;
      case "swiglu-params":
        return <SwigluParamsLab />;
      case "moe-params":
        return <MoeParamsLab />;
      case "moe-router":
        return <MoeRouterLab />;
      case "moe-balance":
        return <MoeBalanceLab />;
      case "moe-memory":
        return <MoeMemoryLab />;
      case "block-trace":
        return <BlockTraceLab />;
      case "weight-names":
        return <WeightNamesLab />;
      case "block-check":
        return <BlockCheckLab />;
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
