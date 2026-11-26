/** Concept labs for Module 03, steps 1–2 (the forward pass; positional information). */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider, Toggle } from "../../../../components/ui";
import { MODEL_CONFIGS, type ModelConfig } from "../../../01-intro-llms/modelConfigs";
import gpt2 from "../../data/gpt2.json";
import { rope, sinusoidal } from "../../positional";

const fmt = (n: number) => n.toLocaleString("en-US");
const BY_ID = Object.fromEntries(MODEL_CONFIGS.map((c) => [c.id, c])) as Record<string, ModelConfig>;
const MODEL_OPTIONS = [
  { value: "gpt2-small", label: "GPT-2 small" },
  { value: "llama3-8b", label: "Llama 3 8B" },
];

/* ------------------------------------------------------------------ step 1: shapes */

/** Lab: the shape of the data at every stage, for a published configuration and any input length. */
export function ShapesLab() {
  const [id, setId] = useState("gpt2-small");
  const [n, setN] = useState(12);
  const c = BY_ID[id]!;
  const rows: [string, number[]][] = [
    ["token IDs", [n]],
    ["token vectors (+ position)", [n, c.dModel]],
    ["attention weights, one block", [c.heads, n, n]],
    ["feed-forward hidden layer", [n, c.ffn]],
    ["output of every block", [n, c.dModel]],
  ];
  const count = (s: number[]) => s.reduce((a, b) => a * b, 1);
  return (
    <Panel title="Shapes through the forward pass">
      <Segmented label="Model" value={id} options={MODEL_OPTIONS} onChange={setId} />
      <Slider label="Tokens in the input" min={1} max={Math.min(4096, c.context)} step={1} value={Math.min(n, c.context)} onChange={setN} format={fmt} />
      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">Shapes</caption>
        <tbody>
          {rows.map(([label, s]) => (
            <tr key={label} className="border-t border-slate-800">
              <td className="py-1 text-slate-300">{label}</td>
              <td className="py-1 font-mono text-sky-200">({s.map(fmt).join(", ")})</td>
              <td className="py-1 text-right font-mono text-xs text-slate-400">{fmt(count(s))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {c.name}, {fmt(n)} tokens: attention weights ({fmt(c.heads)}, {fmt(n)}, {fmt(n)}) = {fmt(count([c.heads, n, n]))} numbers per block; each block returns ({fmt(n)}, {fmt(c.dModel)}), the shape it received.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 1: block parameters */

export function blockParams(c: ModelConfig, kvHeads = c.kvHeads): { attention: number; ffn: number; norms: number } {
  const d = c.dModel;
  if (c.family === "gpt2") return { attention: 3 * d * d + 3 * d + d * d + d, ffn: d * c.ffn + c.ffn + c.ffn * d + d, norms: 4 * d };
  const kv = kvHeads * (d / c.heads);
  return { attention: 2 * d * d + 2 * d * kv, ffn: 3 * d * c.ffn, norms: 2 * d };
}

/** Lab: where one block's parameters live (published configurations, exact counts). */
export function BlockParamsLab() {
  const [id, setId] = useState("llama3-8b");
  const [gqa, setGqa] = useState(true);
  const c = BY_ID[id]!;
  const p = blockParams(c, gqa ? c.kvHeads : c.heads);
  const total = p.attention + p.ffn + p.norms;
  const pc = (x: number) => `${((100 * x) / total).toFixed(1)}%`;
  return (
    <Panel title="One block's parameters">
      <Segmented label="Model" value={id} options={MODEL_OPTIONS} onChange={setId} />
      {c.family === "llama" && (
        <Toggle label="Grouped-query attention (8 KV heads)" checked={gqa} onChange={setGqa} description="Off: one key and value head per query head (32)." />
      )}
      <div className="mt-2 space-y-1.5">
        <Bar label="attention" value={p.attention} max={total} display={`${fmt(p.attention)} · ${pc(p.attention)}`} />
        <Bar label="feed-forward" value={p.ffn} max={total} display={`${fmt(p.ffn)} · ${pc(p.ffn)}`} />
        <Bar label="norms" value={p.norms} max={total} display={fmt(p.norms)} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {c.name} block: {fmt(total)} parameters, {pc(p.ffn)} in the feed-forward network; × {c.layers} blocks.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 2: shuffle test */

const WORDS = ["dog", "bit", "the", "man"];
/** Toy 8-number vectors for the four words (illustrative; fixed so the lab is repeatable). */
const TOY: Record<string, number[]> = {
  dog: [0.9, -0.3, 0.4, 0.1, -0.6, 0.2, 0.5, -0.1],
  bit: [-0.2, 0.8, -0.5, 0.3, 0.1, -0.7, 0.2, 0.4],
  the: [0.1, 0.1, 0.2, -0.9, 0.3, 0.1, -0.2, 0.2],
  man: [0.7, -0.1, 0.6, 0.2, -0.4, 0.5, 0.3, -0.3],
};
const PERMS = [
  [0, 1, 2, 3],
  [3, 1, 2, 0],
  [2, 0, 3, 1],
];

function attend(X: number[][]): number[][] {
  const d = X[0]!.length;
  return X.map((q) => {
    const s = X.map((k) => q.reduce((a, x, i) => a + x * k[i]!, 0) / Math.sqrt(d));
    const m = Math.max(...s);
    const e = s.map((x) => Math.exp(x - m));
    const z = e.reduce((a, b) => a + b, 0);
    return Array.from({ length: d }, (_, j) => X.reduce((a, v, t) => a + (e[t]! / z) * v[j]!, 0));
  });
}

/** Lab: attention without positions only shuffles its outputs; with positions, order changes them. */
export function ShuffleLab() {
  const [pi, setPi] = useState(0);
  const [withPos, setWithPos] = useState(false);
  const order = PERMS[pi]!.map((i) => WORDS[i]!);
  const run = (words: string[]) => {
    const X = words.map((w, p) => (withPos ? TOY[w]!.map((x, j) => x + sinusoidal(p, 8)[j]!) : TOY[w]!));
    return Object.fromEntries(words.map((w, i) => [w, attend(X)[i]!]));
  };
  const base = run(WORDS);
  const now = run(order);
  const same = WORDS.every((w) => base[w]!.every((x, j) => Math.abs(x - now[w]![j]!) < 1e-9));
  return (
    <Panel title="Does attention notice word order? (toy vectors)">
      <p className="font-mono text-sm text-slate-100">{order.join(" ")}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setPi((pi + 1) % PERMS.length)} className="rounded border border-sky-500 px-2 py-1 text-xs text-sky-100">
          Shuffle the tokens
        </button>
        <Toggle label="Add sinusoidal positions" checked={withPos} onChange={setWithPos} />
      </div>
      <table className="mt-2 w-full text-left text-xs">
        <caption className="sr-only">Attention output per word</caption>
        <tbody>
          {WORDS.map((w) => (
            <tr key={w} className="border-t border-slate-800">
              <td className="py-1 font-mono text-slate-300">{w}</td>
              <td className="py-1 font-mono text-slate-400">{now[w]!.slice(0, 4).map((x) => x.toFixed(3)).join("  ")} …</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {pi === 0 ? "Original order. Shuffle to compare." : same ? "Each word's output is exactly what it was before shuffling: attention didn't notice the order." : "Each word's output changed: with positions added, order matters."}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 2: GPT-2's learned positions */

const POS_SIM = Object.entries(gpt2.position_similarity).map(([k, v]) => [Number(k), v] as const);

/** Lab: how similar GPT-2's real learned position vectors are at different distances. */
export function LearnedPosLab() {
  const firstNeg = POS_SIM.find(([, v]) => v < 0);
  return (
    <Panel title="GPT-2's learned position table (real)">
      <p className="text-xs text-slate-400">Average cosine similarity between position vectors k apart, over every pair in GPT-2's 1,024 × 768 table.</p>
      <div className="mt-2 space-y-1.5">
        {POS_SIM.map(([k, v]) => (
          <Bar key={k} label={`k = ${k}`} value={Math.max(0, v)} max={1} display={v.toFixed(3)} />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Neighbours are almost identical ({POS_SIM[0]![1].toFixed(3)}); by distance {firstNeg?.[0]} the similarity is negative ({firstNeg?.[1].toFixed(3)}). GPT-2 has no row beyond position 1,024.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 2: RoPE */

const Q = [0.9, 0.2, -0.4, 0.7];
const K = [0.5, -0.8, 0.3, 0.6];

/** Lab: rotate a query and a key by their positions; the score depends only on the gap. */
export function RopeRelativeLab() {
  const [m, setM] = useState(5);
  const [n, setN] = useState(2);
  const q = rope(Q, m);
  const k = rope(K, n);
  const score = q.reduce((a, x, i) => a + x * k[i]!, 0);
  const R = 80;
  const arrow = (v: number[], cls: string, label: string) => {
    const len = Math.hypot(v[0]!, v[1]!);
    const x = (v[0]! / len) * R;
    const y = -(v[1]! / len) * R;
    return (
      <g>
        <line x1={0} y1={0} x2={x} y2={y} className={cls} strokeWidth={3} />
        <text x={x * 1.15} y={y * 1.15} className="fill-slate-300 text-[10px]" textAnchor="middle">
          {label}
        </text>
      </g>
    );
  };
  return (
    <Panel title="RoPE: rotate by position, compare by distance">
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider label="Query position m" min={0} max={200} step={1} value={m} onChange={setM} />
        <Slider label="Key position n" min={0} max={200} step={1} value={n} onChange={setN} />
      </div>
      <svg viewBox="-110 -110 220 220" role="img" aria-label="First pair of the query and key, rotated" className="mx-auto mt-2 h-44 w-full max-w-xs">
        <circle r={R} className="fill-none stroke-slate-700" />
        {arrow(q, "stroke-sky-400", "q")}
        {arrow(k, "stroke-amber-400", "k")}
      </svg>
      <p role="status" className="mt-1 text-sm text-slate-100">
        m − n = {m - n}: score q·k = {score.toFixed(4)}
      </p>
      <p className="mt-1 text-xs text-slate-400">The arrows are the first pair of each 4-number vector. Moving both positions by the same amount turns both arrows together, so the angle between them, and the score, stay put.</p>
    </Panel>
  );
}
