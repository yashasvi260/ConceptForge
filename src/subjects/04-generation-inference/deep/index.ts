import type { DeepContent } from "../../../core/types";
import { deepData } from "./data";
import { decoding } from "./decoding";
import { logits } from "./logits";

/** Module 04's deep lessons by step id, loaded on demand (see index.ts loadDeep). */
export const content: DeepContent = {
  lessons: { logits, decoding },
  data: deepData,
};
