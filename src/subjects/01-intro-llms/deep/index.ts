import type { DeepContent } from "../../../core/types";
import { anatomy } from "./anatomy";
import { architectures } from "./architectures";
import { bagOfWords } from "./bag-of-words";
import { bigPicture } from "./big-picture";
import { context } from "./context";
import { deepData } from "./data";
import { denseEmbeddings } from "./dense-embeddings";
import { encoderDecoder } from "./encoder-decoder";
import { howLarge } from "./how-large";
import { pretrainingFinetuning } from "./pretraining-finetuning";
import { recap } from "./recap";
import { representationVsGenerative } from "./representation-vs-generative";
import { trainVsUse } from "./train-vs-use";

/** Module 01's deep lessons by step id, loaded on demand (see index.ts loadDeep). */
export const content: DeepContent = {
  lessons: {
    "big-picture": bigPicture,
    anatomy,
    "how-large": howLarge,
    "train-vs-use": trainVsUse,
    "bag-of-words": bagOfWords,
    "dense-embeddings": denseEmbeddings,
    context,
    architectures,
    "encoder-decoder": encoderDecoder,
    "representation-vs-generative": representationVsGenerative,
    "pretraining-finetuning": pretrainingFinetuning,
    recap,
  },
  data: deepData,
};
