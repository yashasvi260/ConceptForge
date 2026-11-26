import type { DeepContent } from "../../../core/types";
import { deepData } from "./data";
import { whyNumbers } from "./why-numbers";

/** Module 02's deep lessons by step id, loaded on demand (see index.ts loadDeep). */
export const content: DeepContent = {
  lessons: {
    "why-numbers": whyNumbers,
  },
  data: deepData,
};
