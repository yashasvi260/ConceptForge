import type { DeepContent } from "../../../core/types";
import { deepData } from "./data";
import { decoding } from "./decoding";
import { generationLoop } from "./generation-loop";
import { kvCache } from "./kv-cache";
import { logits } from "./logits";
import { longContext } from "./long-context";
import { recap } from "./recap";
import { truncation } from "./truncation";

/** Module 04's deep lessons by step id, loaded on demand (see index.ts loadDeep). */
export const content: DeepContent = {
  lessons: { logits, decoding, truncation, "generation-loop": generationLoop, "kv-cache": kvCache, "long-context": longContext, recap },
  data: deepData,
};
