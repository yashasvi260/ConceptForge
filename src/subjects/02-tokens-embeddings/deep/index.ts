import type { DeepContent } from "../../../core/types";
import { bpeEncoding } from "./bpe-encoding";
import { bpeTraining } from "./bpe-training";
import { bytesLesson } from "./bytes";
import { cheatSheet } from "./cheat-sheet";
import { deepData } from "./data";
import { lookupTable } from "./lookup-table";
import { playground } from "./playground";
import { quirks } from "./quirks";
import { sentenceEmbeddings } from "./sentence-embeddings";
import { sentencepiece } from "./sentencepiece";
import { specialTokens } from "./special-tokens";
import { staticVsContextual } from "./static-vs-contextual";
import { vocabulary } from "./vocabulary";
import { whyNumbers } from "./why-numbers";
import { wordpiece } from "./wordpiece";

/** Module 02's deep lessons by step id, loaded on demand (see index.ts loadDeep). */
export const content: DeepContent = {
  lessons: {
    "why-numbers": whyNumbers,
    vocabulary,
    "bpe-training": bpeTraining,
    "bpe-encoding": bpeEncoding,
    bytes: bytesLesson,
    wordpiece,
    sentencepiece,
    "special-tokens": specialTokens,
    playground,
    quirks,
    "lookup-table": lookupTable,
    "static-vs-contextual": staticVsContextual,
    "sentence-embeddings": sentenceEmbeddings,
    "cheat-sheet": cheatSheet,
  },
  data: deepData,
};
