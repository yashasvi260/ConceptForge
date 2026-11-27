/** Typed access to the real GPT-2 small recording (scripts/record-m04-generation.mjs). */
import raw from "./generation.json";

export interface TopToken { token: string; id: number; logit: number; prob: number }
export interface TempStats { T: number; lse: number; entropy_bits: number; top1: number; nucleus90: number }
export interface Dist {
  prompt: string;
  tokens: string[];
  top: TopToken[];
  lse: number;
  max_logit: number;
  min_logit: number;
  temps: TempStats[];
  tail: Record<string, number>;
  nucleus: Record<string, number>;
  minp: Record<string, number>;
}
export interface Continuation { text: string; tokens: string[]; logprob: number; ranks: number[] }
export interface Sample extends Continuation { setting: string; seed: number; temperature: number; top_k: number; top_p: number }
export interface LoopStep { step: number; fed: number; context: number; token: string; prob: number; ms: number }

export const GEN = raw as unknown as {
  model: string;
  transformers: string;
  torch: string;
  config: { vocab: number; d_model: number; layers: number; heads: number; n_positions: number };
  dists: Dist[];
  lm_head: { prompt: string; tied: boolean; vocab: number; d_model: number; h: number[]; rows: { token: string; id: number; logit: number; e: number[] }[]; h_norm: number };
  positions: { text: string; rows: { prefix_end: string; actual: string; p_actual: number; guess: string; p_guess: number }[]; mean_loss: number };
  greedy: Record<string, Continuation>;
  beam: Continuation;
  penalties: Record<string, Continuation>;
  eos: { id: number; token: string };
  sample_prompt: string;
  samples: Sample[];
  kv: {
    prompt: string; same_tokens: boolean; max_logit_diff: number; text: string;
    steps_cache: LoopStep[]; steps_nocache: LoopStep[]; layer_shape: number[]; layers: number; bytes_per_number: number;
    timing: { cpu_threads: number; prompt_tokens: number; new_tokens: number; prefill_ms: number; prefill_by_length: { tokens: number; ms: number }[]; decode_ms_median_cache: number; decode_ms_median_nocache: number; decode_total_ms_cache: number; decode_total_ms_nocache: number };
  };
  long_context: { n_positions: number; text: string; windows: number; by_context: { from: number; to: number; loss: number; count: number }[]; over_limit_error: string };
};

/** Probability of a top token at temperature T, normalised over the FULL vocabulary (recorded log-sum-exp at T). */
export function probAt(d: Dist, logit: number, T: number): number {
  const s = d.temps.find((t) => Math.abs(t.T - T) < 1e-9);
  if (!s) throw new Error(`no recorded temperature ${T}`);
  return Math.exp(logit / T - s.lse);
}

export const show = (t: string) => JSON.stringify(t);
export const fmt = (n: number) => n.toLocaleString("en-US");
