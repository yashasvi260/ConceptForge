/** Concept labs for Module 03, steps 3–4 (queries, keys and values; self-attention in real GPT-2). */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider, Toggle } from "../../../../components/ui";
import gpt2 from "../../data/gpt2.json";

const f3 = (x: number) => x.toFixed(3);
const fmt = (n: number) => n.toLocaleString("en-US");
const softmax = (xs: number[]) => {
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp(x - m));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / z);
};
const matvec = (x: number[], W: number[][]) => W[0]!.map((_, j) => x.reduce((a, xi, i) => a + xi * W[i]![j]!, 0));

/* ------------------------------------------------------------------ step 3: Q, K, V projections */

/** The worked example's toy vectors and matrices (made up; real models learn W_Q, W_K, W_V). */
export const TOY_TOKENS = ["the", "bank", "approved"];
const TOY_X = [
  [0.1, 0.2, -0.3, 0.9],
  [0.8, -0.5, 0.4, 0.1],
  [0.6, 0.7, 0.2, -0.4],
];
const WQ = [
  [1, 0, 0.5, 0],
  [0, 1, 0, 0.5],
  [0.5, 0, 1, 0],
  [0, 0.5, 0, 1],
];
const WK = [
  [0.8, 0.2, 0, 0],
  [0.2, 0.8, 0, 0],
  [0, 0, 0.8, 0.2],
  [0, 0, 0.2, 0.8],
];
const WV = [
  [0, 1, 0, 0],
  [1, 0, 0, 0],
  [0, 0, 0, 1],
  [0, 0, 1, 0],
];

/** Lab: one token's vector becomes three different vectors, one per role. */
export function QkvProjectLab() {
  const [t, setT] = useState("approved");
  const i = TOY_TOKENS.indexOf(t);
  const x = TOY_X[i]!;
  const rows: [string, number[]][] = [
    ["x (token vector)", x],
    ["q = x · W_Q", matvec(x, WQ)],
    ["k = x · W_K", matvec(x, WK)],
    ["v = x · W_V", matvec(x, WV)],
  ];
  const q = matvec(TOY_X[2]!, WQ);
  const w = softmax(TOY_X.map((xk) => matvec(xk, WK).reduce((a, kk, j) => a + kk * q[j]!, 0) / 2));
  return (
    <Panel title="Three roles from one vector (toy, d = 4)">
      <Segmented label="Token" value={t} options={TOY_TOKENS.map((v) => ({ value: v, label: v }))} onChange={setT} />
      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">Query, key and value</caption>
        <tbody>
          {rows.map(([label, v]) => (
            <tr key={label} className="border-t border-slate-800">
              <td className="py-1 text-slate-300">{label}</td>
              <td className="py-1 font-mono text-sky-200">[{v.map((n) => n.toFixed(2)).join(", ")}]</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-100">
        “{t}”: q = [{rows[1]![1].map((n) => n.toFixed(2)).join(", ")}]. The query of “approved” gives weights {w.map(f3).join(" / ")} to the, bank, approved.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 3: √d */

/** Seeded random normals (mulberry32 + Box–Muller), so the lab is repeatable. */
function normals(seed: number) {
  let a = seed >>> 0;
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

/** Spread of random q·k scores over 8 keys (500 queries), and softmax's average top weight. */
export function simulateScores(d: number, scaled: boolean): { std: number; top: number } {
  const r = normals(d);
  const all: number[] = [];
  let top = 0;
  for (let n = 0; n < 500; n++) {
    const q = Array.from({ length: d }, r);
    const s = Array.from({ length: 8 }, () => q.reduce((a, x) => a + x * r(), 0) / (scaled ? Math.sqrt(d) : 1));
    all.push(...s);
    top += Math.max(...softmax(s));
  }
  const mean = all.reduce((a, b) => a + b, 0) / all.length;
  const std = Math.sqrt(all.reduce((a, b) => a + (b - mean) ** 2, 0) / all.length);
  return { std, top: top / 500 };
}

/** Lab: random scores spread like √d; scaling keeps softmax from locking onto one key. */
export function SqrtDLab() {
  const [d, setD] = useState<"4" | "16" | "64" | "256">("64");
  const [scaled, setScaled] = useState(false);
  const r = simulateScores(Number(d), scaled);
  return (
    <Panel title="Why divide by √d (random vectors, 500 queries × 8 keys)">
      <Segmented
        label="Head width d"
        value={d}
        options={["4", "16", "64", "256"].map((v) => ({ value: v as typeof d, label: v }))}
        onChange={setD}
      />
      <Toggle label="Divide scores by √d" checked={scaled} onChange={setScaled} />
      <div className="mt-2 space-y-1.5">
        <Bar label="spread of scores (std)" value={Math.min(r.std, 16)} max={16} display={r.std.toFixed(2)} />
        <Bar label="weight on the top key" value={r.top} max={1} display={`${(100 * r.top).toFixed(0)}%`} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        d = {d}, {scaled ? "scaled" : "raw"}: scores spread {r.std.toFixed(1)}; the top key gets {(100 * r.top).toFixed(0)}% of the weight on average.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 3: mixing values */

const VALUES = [
  [0, 80],
  [-70, -40],
  [70, -40],
];
const BASE_SCORES = [1, 0.5, -0.2];

/** Lab: the output is a weighted average of the values, so it always stays inside their triangle. */
export function ValueMixLab() {
  const [sharp, setSharp] = useState(1);
  const w = softmax(BASE_SCORES.map((s) => s * sharp));
  const out = [0, 1].map((k) => w.reduce((a, wi, i) => a + wi * VALUES[i]![k]!, 0));
  return (
    <Panel title="Mixing the values (toy, 2 numbers per value)">
      <Slider label="Score sharpness (× scores)" min={0} max={10} step={0.5} value={sharp} onChange={setSharp} format={(v) => v.toFixed(1)} />
      <svg viewBox="-100 -100 200 200" role="img" aria-label="Three value vectors and the weighted output" className="mx-auto mt-2 h-48 w-full max-w-xs">
        <polygon points={VALUES.map(([x, y]) => `${x},${-y!}`).join(" ")} className="fill-sky-500/10 stroke-slate-600" />
        {VALUES.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={-y!} r={5} className="fill-slate-300" />
            <text x={x! * 1.18} y={-y! * 1.18 + 4} textAnchor="middle" className="fill-slate-300 text-[10px]">
              v{i + 1} · {(100 * w[i]!).toFixed(0)}%
            </text>
          </g>
        ))}
        <circle cx={out[0]} cy={-out[1]!} r={6} className="fill-amber-400" />
      </svg>
      <p role="status" className="mt-1 text-sm text-slate-100">
        Weights {w.map(f3).join(" / ")} → output ({out[0]!.toFixed(1)}, {out[1]!.toFixed(1)}), inside the triangle of values.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 4: real GPT-2 heads */

const SENTS = gpt2.sentences as { text: string; tokens: string[]; attn: number[][][][] }[];
const SENT_OPTIONS = SENTS.map((s, i) => ({ value: String(i), label: s.text.split(" ").slice(0, 3).join(" ") + " …" }));
const show = (t: string) => JSON.stringify(t);

/** Lab: browse GPT-2 small's real attention weights, layer by layer and head by head. */
export function RealHeadsLab() {
  const [si, setSi] = useState("0");
  const [layer, setLayer] = useState(4);
  const [head, setHead] = useState(11);
  const s = SENTS[Number(si)]!;
  const n = s.tokens.length;
  const [q, setQ] = useState(n - 1);
  const qi = Math.min(q, n - 1);
  const W = s.attn[layer]![head]!;
  const row = W[qi]!;
  const best = row.indexOf(Math.max(...row));
  return (
    <Panel title="Real attention weights (GPT-2 small)">
      <Segmented label="Sentence" value={si} options={SENT_OPTIONS} onChange={(v) => { setSi(v); setQ(SENTS[Number(v)]!.tokens.length - 1); }} />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Slider label="Layer" min={0} max={11} step={1} value={layer} onChange={setLayer} />
        <Slider label="Head" min={0} max={11} step={1} value={head} onChange={setHead} />
      </div>
      <div className="mt-2 overflow-x-auto">
        <div className="inline-grid gap-px" style={{ gridTemplateColumns: `repeat(${n}, 1.1rem)` }} aria-hidden>
          {W.map((r, i) => r.map((v, j) => <span key={`${i}-${j}`} className={`h-[1.1rem] ${i === qi ? "outline outline-1 outline-amber-400" : ""}`} style={{ backgroundColor: `rgba(56,189,248,${v})` }} />))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {s.tokens.map((t, i) => (
          <button key={i} type="button" onClick={() => setQ(i)} aria-pressed={i === qi} aria-label={`Query ${i}: ${t}`} className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${i === qi ? "bg-amber-500/30 text-amber-100" : "bg-slate-800 text-slate-300"}`}>
            {t.replace(/ /g, "␣")}
          </button>
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Layer {layer}, head {head}: {show(s.tokens[qi]!)} puts {(100 * row[best]!).toFixed(0)}% on {show(s.tokens[best]!)}.
      </p>
      <p className="mt-1 text-xs text-slate-400">Rows are queries, columns keys; the upper triangle is empty because of the causal mask.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 4: head finder */

type Metric = "previous" | "first" | "self";
const STATS = gpt2.head_stats as Record<Metric, number[][]>;

/** Lab: colour all 144 GPT-2 heads by what they attend to (averaged over 8 real sentences). */
export function HeadFinderLab() {
  const [metric, setMetric] = useState<Metric>("previous");
  const [sel, setSel] = useState<[number, number] | null>(null);
  const M = STATS[metric];
  let best: [number, number, number] = [0, 0, -1];
  M.forEach((r, l) => r.forEach((v, h) => v > best[2] && (best = [l, h, v])));
  const name = { previous: "previous-token", first: "first-token", self: "self" }[metric];
  return (
    <Panel title="What all 144 heads attend to (GPT-2 small, 8 sentences)">
      <Segmented
        label="Colour by"
        value={metric}
        options={[
          { value: "previous", label: "previous token" },
          { value: "first", label: "first token" },
          { value: "self", label: "itself" },
        ]}
        onChange={setMetric}
      />
      <div className="mt-2 overflow-x-auto">
        <table className="text-[10px]">
          <thead>
            <tr>
              <th />
              {M[0]!.map((_, h) => (
                <th key={h} className="w-5 font-normal text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {M.map((r, l) => (
              <tr key={l}>
                <th className="pr-1 text-right font-normal text-slate-500">L{l}</th>
                {r.map((v, h) => (
                  <td key={h} className="p-px">
                    <button type="button" aria-label={`Layer ${l}, head ${h}: ${f3(v)}`} onClick={() => setSel([l, h])} className="block h-4 w-5 rounded-sm" style={{ backgroundColor: `rgba(56,189,248,${v})` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Strongest {name} head: layer {best[0]}, head {best[1]} ({f3(best[2])}).
        {sel && ` Selected: layer ${sel[0]}, head ${sel[1]}: ${f3(M[sel[0]]![sel[1]]!)}.`}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 4: attention cost */

const COST_MODELS = { "gpt2-small": { name: "GPT-2 small", heads: 12 }, "llama3-8b": { name: "Llama 3 8B", heads: 32 } } as const;
type CostId = keyof typeof COST_MODELS;

/** Bytes for one layer's attention tables if they were stored (16-bit numbers). */
export const attnTableBytes = (heads: number, n: number) => heads * n * n * 2;

/** Lab: how one layer's attention tables grow with the input length (computed). */
export function AttnCostLab() {
  const [id, setId] = useState<CostId>("gpt2-small");
  const [exp, setExp] = useState(10);
  const n = 2 ** exp;
  const m = COST_MODELS[id];
  const bytes = attnTableBytes(m.heads, n);
  const size = bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${(bytes / 1e6).toFixed(1)} MB`;
  return (
    <Panel title="Attention tables grow with n²">
      <Segmented<CostId> label="Model" value={id} options={(Object.keys(COST_MODELS) as CostId[]).map((k) => ({ value: k, label: COST_MODELS[k].name }))} onChange={setId} />
      <Slider label="Input length (tokens)" min={4} max={17} step={1} value={exp} onChange={setExp} format={(e) => fmt(2 ** e)} />
      <p role="status" className="mt-2 text-sm text-slate-100">
        n = {fmt(n)}: {m.heads} heads × {fmt(n * n)} weights = {size} per layer (16-bit), if stored.
      </p>
      <p className="mt-1 text-xs text-slate-400">Doubling n quadruples the tables. FlashAttention computes the same result without ever storing them in full.</p>
    </Panel>
  );
}
