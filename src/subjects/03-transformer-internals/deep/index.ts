import type { DeepContent } from "../../../core/types";
import { deepData } from "./data";
import { ffn } from "./ffn";
import { forwardPass } from "./forward-pass";
import { gqa } from "./gqa";
import { moe } from "./moe";
import { multiHead } from "./multi-head";
import { positional } from "./positional";
import { qkv } from "./qkv";
import { residualNorm } from "./residual-norm";
import { selfAttention } from "./self-attention";

/** Module 03's deep lessons by step id, loaded on demand (see index.ts loadDeep). */
export const content: DeepContent = {
  lessons: {
    "forward-pass": forwardPass,
    positional,
    qkv,
    "self-attention": selfAttention,
    "multi-head": multiHead,
    gqa,
    "residual-norm": residualNorm,
    ffn,
    moe,
  },
  data: deepData,
};
