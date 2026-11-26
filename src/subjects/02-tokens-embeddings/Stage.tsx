import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Panel } from "../../components/ui";
import type { StageProps } from "../../core/types";
import { BpeEncodeView } from "./views/BpeEncodeView";
import { BpeTrainView } from "./views/BpeTrainView";
import { BytesView } from "./views/BytesView";
import { CheatSheetView } from "./views/CheatSheetView";
import { BankShiftView, LookupView, SearchPreviewView, SentenceEmbeddingsView, SimilarityView, StaticContextualView } from "./views/embeddingViews";
import { ChopView } from "./views/ChopView";
import { IntroView } from "./views/IntroView";
import { LanguagesView } from "./views/LanguagesView";
import { PlaygroundView } from "./views/PlaygroundView";
import { PracticeView } from "./views/PracticeView";
import { QuirksView } from "./views/QuirksView";
import { SpecialTokensView } from "./views/SpecialTokensView";
import { UnigramView } from "./views/UnigramView";
import { BpeCompressLab, FertilityLab, MergeOrderLab, MergesCurveLab, PretokenizeLab, VariantsLab } from "./views/labs/BpeLabs";
import { ByteStandinsLab, ByteTaxLab, StreamDecodeLab, WpFertilityLab, WpScoreLab, WpUnkLab } from "./views/labs/BytesWordPieceLabs";
import { AddTokensLab, OovLab, SeqLengthLab, VocabBuysLab, VocabCostLab } from "./views/labs/TokenBasicsLabs";
import { VocabView } from "./views/VocabView";
import { WordPieceView } from "./views/WordPieceView";

export const DEFAULT_SAMPLE = "Unbelievably, the tokenizer handled 🤖 emoji!";
/** Sennrich, Haddow & Birch (2016), Algorithm 1: low ×5, lower ×2, newest ×6, widest ×3. */
export const DEFAULT_CORPUS = `${"low ".repeat(5)}${"lower ".repeat(2)}${"newest ".repeat(6)}${"widest ".repeat(3)}`.trim();

export function Stage({ step }: StageProps) {
  const [sample, setSample] = useState(DEFAULT_SAMPLE);
  const [corpus, setCorpus] = useState(DEFAULT_CORPUS);

  const view = (() => {
    switch (step.view) {
      case "intro":
        return <IntroView text={sample} setText={setSample} />;
      case "chop":
        return <ChopView text={sample} setText={setSample} />;
      case "vocab":
        return <VocabView text={sample} setText={setSample} />;
      case "bpe-train":
        return <BpeTrainView corpus={corpus} setCorpus={setCorpus} />;
      case "bpe-encode":
        return <BpeEncodeView corpus={corpus} />;
      case "bytes":
        return <BytesView />;
      case "wordpiece":
        return <WordPieceView />;
      case "unigram":
        return <UnigramView />;
      case "special":
        return <SpecialTokensView />;
      case "playground":
        return <PlaygroundView />;
      case "languages":
        return <LanguagesView />;
      case "quirks":
        return <QuirksView />;
      case "practice":
        return <PracticeView />;
      case "lookup":
        return <LookupView />;
      case "static-contextual":
        return <StaticContextualView />;
      case "bank-shift":
        return <BankShiftView />;
      case "sentence-emb":
        return <SentenceEmbeddingsView />;
      case "similarity":
        return <SimilarityView />;
      case "search-preview":
        return <SearchPreviewView />;
      case "cheatsheet":
        return <CheatSheetView />;
      case "oov":
        return <OovLab />;
      case "seq-length":
        return <SeqLengthLab />;
      case "vocab-cost":
        return <VocabCostLab />;
      case "vocab-buys":
        return <VocabBuysLab />;
      case "add-tokens":
        return <AddTokensLab />;
      case "bpe-compress":
        return <BpeCompressLab />;
      case "pretokenize":
        return <PretokenizeLab />;
      case "merges-curve":
        return <MergesCurveLab />;
      case "merge-order":
        return <MergeOrderLab />;
      case "fertility":
        return <FertilityLab />;
      case "variants":
        return <VariantsLab />;
      case "byte-tax":
        return <ByteTaxLab />;
      case "byte-standins":
        return <ByteStandinsLab />;
      case "stream-decode":
        return <StreamDecodeLab />;
      case "wp-unk":
        return <WpUnkLab />;
      case "wp-score":
        return <WpScoreLab />;
      case "wp-fertility":
        return <WpFertilityLab />;
      default:
        return (
          <Panel>
            <p className="py-10 text-center text-sm text-slate-500">Unknown view “{step.view}”.</p>
          </Panel>
        );
    }
  })();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.view}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="min-w-0 space-y-4"
      >
        {view}
      </motion.div>
    </AnimatePresence>
  );
}
