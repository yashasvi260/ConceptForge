import type { DeepContent } from "../../../core/types";
import { deepData } from "./data";
import { forwardPass } from "./forward-pass";
import { positional } from "./positional";

/** Module 03's deep lessons by step id, loaded on demand (see index.ts loadDeep). */
export const content: DeepContent = {
  lessons: {
    "forward-pass": forwardPass,
    positional,
  },
  data: deepData,
};
