/** Concept labs for Module 03, step 10 (the mini-project: one GPT-2 block, checked against the real model). */
import { useState } from "react";
import { Panel } from "../../../../components/ui";
import gpt2 from "../../data/gpt2.json";

const fmt = (n: number) => n.toLocaleString("en-US");
const d = 768;
const f = 3072;
const H = 12;
const n = 12;

/** GPT-2 small's block, operation by operation: shape out and parameters (computed from its configuration). */
export const BLOCK_OPS: { op: string; shape: string; params: number; changes: "shape" | "numbers" }[] = [
  { op: "LayerNorm 1", shape: `(${n}, ${d})`, params: 2 * d, changes: "numbers" },
  { op: "Q, K, V in one product, split into 12 heads", shape: `3 × (${H}, ${n}, ${d / H})`, params: d * 3 * d + 3 * d, changes: "shape" },
  { op: "scores, causal mask, softmax", shape: `(${H}, ${n}, ${n})`, params: 0, changes: "shape" },
  { op: "weighted values, heads merged, output projection", shape: `(${n}, ${d})`, params: d * d + d, changes: "shape" },
  { op: "add to the stream (residual)", shape: `(${n}, ${d})`, params: 0, changes: "numbers" },
  { op: "LayerNorm 2", shape: `(${n}, ${d})`, params: 2 * d, changes: "numbers" },
  { op: "feed-forward: widen, GELU, narrow", shape: `(${n}, ${f}) → (${n}, ${d})`, params: d * f + f + f * d + d, changes: "shape" },
  { op: "add to the stream (residual)", shape: `(${n}, ${d})`, params: 0, changes: "numbers" },
];

/** Lab: step through one GPT-2 small block for a 12-token sentence. */
export function BlockTraceLab() {
  const [i, setI] = useState(0);
  const so = BLOCK_OPS.slice(0, i + 1).reduce((a, o) => a + o.params, 0);
  const o = BLOCK_OPS[i]!;
  return (
    <Panel title="One GPT-2 small block, operation by operation (12 tokens)">
      <ol className="space-y-1 text-sm">
        {BLOCK_OPS.map((op, k) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => setI(k)}
              aria-pressed={k === i}
              className={`flex w-full justify-between gap-2 rounded border px-2 py-1 text-left ${k === i ? "border-sky-400 text-sky-100" : k < i ? "border-emerald-700/60 text-emerald-200" : "border-slate-800 text-slate-400"}`}
            >
              <span>
                {k + 1}. {op.op}
              </span>
              <span className="font-mono text-xs">{op.shape}</span>
            </button>
          </li>
        ))}
      </ol>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Step {i + 1}, {o.op}: out {o.shape}, {fmt(o.params)} parameters ({o.changes === "shape" ? "changes the shape" : "same shape, new numbers"}); {fmt(so)} of the block's 7,087,872 so far.
      </p>
    </Panel>
  );
}

/** GPT-2 small's real checkpoint names for block 0 and the tensors outside the blocks, with their shapes. */
export const WEIGHT_NAMES: { name: string; shape: string; use: string }[] = [
  { name: "wte.weight", shape: "50,257 × 768", use: "token table (Module 02); also the output head" },
  { name: "wpe.weight", shape: "1,024 × 768", use: "learned position table (step 2)" },
  { name: "h.0.ln_1.weight / .bias", shape: "768 / 768", use: "LayerNorm 1 gain and bias (step 7)" },
  { name: "h.0.attn.c_attn.weight", shape: "768 × 2,304", use: "Q, K and V for all 12 heads in one product (steps 3, 5)" },
  { name: "h.0.attn.c_proj.weight", shape: "768 × 768", use: "output projection W_O (step 5)" },
  { name: "h.0.ln_2.weight / .bias", shape: "768 / 768", use: "LayerNorm 2 gain and bias (step 7)" },
  { name: "h.0.mlp.c_fc.weight", shape: "768 × 3,072", use: "feed-forward widening matrix (step 8)" },
  { name: "h.0.mlp.c_proj.weight", shape: "3,072 × 768", use: "feed-forward narrowing matrix (step 8)" },
  { name: "ln_f.weight / .bias", shape: "768 / 768", use: "final LayerNorm after block 12 (step 7)" },
];

/** Lab: match GPT-2's real weight names to the operations that use them. */
export function WeightNamesLab() {
  const [sel, setSel] = useState(3);
  const w = WEIGHT_NAMES[sel]!;
  return (
    <Panel title="GPT-2 small's weights, by name">
      <ul className="space-y-1">
        {WEIGHT_NAMES.map((x, k) => (
          <li key={x.name}>
            <button type="button" onClick={() => setSel(k)} aria-pressed={k === sel} className={`flex w-full justify-between gap-2 rounded border px-2 py-1 text-left font-mono text-xs ${k === sel ? "border-sky-400 text-sky-100" : "border-slate-800 text-slate-300"}`}>
              <span>{x.name}</span>
              <span>{x.shape}</span>
            </button>
          </li>
        ))}
      </ul>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {w.name} ({w.shape}): {w.use}.
      </p>
      <p className="mt-1 text-xs text-slate-400">GPT-2 stores matrices as in × out and multiplies x @ W (its Conv1D layers); PyTorch Linear layers store out × in.</p>
    </Panel>
  );
}

const CHECK = gpt2.numpy_check as { text: string; rows: [string, number, number][] };

/** Lab: the recorded comparison between plain NumPy with GPT-2's real weights and the real model. */
export function BlockCheckLab() {
  return (
    <Panel title="Plain NumPy vs the real GPT-2 (recorded)">
      <p className="text-xs text-slate-400">“{CHECK.text}”, 12 tokens × 768 numbers compared at each point.</p>
      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">Largest differences</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="font-normal">compared after</th>
            <th className="font-normal">largest difference</th>
            <th className="font-normal">largest value</th>
          </tr>
        </thead>
        <tbody>
          {CHECK.rows.map(([label, diff, max]) => (
            <tr key={label} className="border-t border-slate-800">
              <td className="py-1 text-slate-300">{label}</td>
              <td className="py-1 font-mono text-emerald-200">{diff.toExponential(1)}</td>
              <td className="py-1 font-mono text-slate-300">{max}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-100">
        After all 12 blocks, the largest difference is {CHECK.rows[1]![1].toExponential(1)} on values up to {CHECK.rows[1]![2]}: about {(CHECK.rows[1]![1] / CHECK.rows[1]![2]).toExponential(0)} of the scale, which is 32-bit rounding.
      </p>
    </Panel>
  );
}
