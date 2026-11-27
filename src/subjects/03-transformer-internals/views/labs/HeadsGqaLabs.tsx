/** Concept labs for Module 03, steps 5–6 (multi-head attention; grouped-query attention). */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider } from "../../../../components/ui";
import gpt2 from "../../data/gpt2.json";

const fmt = (n: number) => n.toLocaleString("en-US");
const show = (t: string) => JSON.stringify(t);

/* ------------------------------------------------------------------ step 5: splitting into heads */

const D = 768;
const HEAD_OPTIONS = ["1", "2", "4", "12", "24", "48"] as const;

/** Lab: GPT-2 small's width split into different numbers of heads (computed). */
export function HeadSplitLab() {
  const [h, setH] = useState<(typeof HEAD_OPTIONS)[number]>("12");
  const H = Number(h);
  const params = 3 * D * D + 3 * D + D * D + D;
  const n = 12;
  return (
    <Panel title="Splitting 768 numbers into heads (GPT-2 small's width)">
      <Segmented label="Heads" value={h} options={HEAD_OPTIONS.map((v) => ({ value: v, label: v }))} onChange={setH} />
      <div className="mt-2 flex h-6 overflow-hidden rounded" aria-hidden>
        {Array.from({ length: H }, (_, i) => (
          <span key={i} className="flex-1 border-r border-slate-950" style={{ backgroundColor: `hsl(${(i * 360) / H}, 60%, 55%)` }} />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {H} head{H === 1 ? "" : "s"} × {D / H} numbers each; attention parameters stay {fmt(params)}; {fmt(H * n * n)} attention weights per layer for 12 tokens.
      </p>
      <p className="mt-1 text-xs text-slate-400">Each coloured band is one head's slice of every token's vector. The Q, K, V and output matrices are 768 × 768 whatever the split.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 5: real heads in one layer */

const SENTS = gpt2.sentences as { text: string; tokens: string[]; attn: number[][][][] }[];

/** Lab: one token's favourite key in each of a layer's 12 real heads (GPT-2 small). */
export function HeadGridLab() {
  const s = SENTS[0]!;
  const [layer, setLayer] = useState(2);
  const [q, setQ] = useState(s.tokens.indexOf(" loan"));
  const tops = s.attn[layer]!.map((head) => {
    const row = head[q]!.slice(0, q + 1);
    const j = row.indexOf(Math.max(...row));
    return { j, w: row[j]! };
  });
  const distinct = new Set(tops.map((t) => t.j)).size;
  return (
    <Panel title="One layer, 12 real heads (GPT-2 small)">
      <Slider label="Layer" min={0} max={11} step={1} value={layer} onChange={setLayer} />
      <div className="mt-1 flex flex-wrap gap-1">
        {s.tokens.map((t, i) => (
          <button key={i} type="button" onClick={() => setQ(i)} aria-pressed={i === q} aria-label={`Query ${i}: ${t}`} className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${i === q ? "bg-amber-500/30 text-amber-100" : "bg-slate-800 text-slate-300"}`}>
            {t.replace(/ /g, "␣")}
          </button>
        ))}
      </div>
      <ol className="mt-2 grid grid-cols-2 gap-1 text-xs sm:grid-cols-3">
        {tops.map((t, h) => (
          <li key={h} className="rounded border border-slate-800 px-2 py-1">
            <span className="text-slate-500">head {h}</span> → <span className="font-mono text-sky-200">{show(s.tokens[t.j]!)}</span> <span className="text-slate-400">{(100 * t.w).toFixed(0)}%</span>
          </li>
        ))}
      </ol>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Layer {layer}: {show(s.tokens[q]!)}'s 12 heads have {distinct} different favourite key{distinct === 1 ? "" : "s"}.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 5: head ablation */

const AB = gpt2.head_ablation as { base_loss: number; loss_increase: number[][] };

/** Lab: how much GPT-2's real loss rises when each head is switched off alone (8 sentences). */
export function HeadAblationLab() {
  const [sel, setSel] = useState<[number, number]>([4, 11]);
  const M = AB.loss_increase;
  const max = Math.max(...M.flat());
  const v = M[sel[0]]![sel[1]]!;
  const below = M.flat().filter((x) => x < 0.01).length;
  return (
    <Panel title="Switching off one head at a time (real GPT-2 small)">
      <div className="overflow-x-auto">
        <table className="text-[10px]">
          <tbody>
            {M.map((r, l) => (
              <tr key={l}>
                <th className="pr-1 text-right font-normal text-slate-500">L{l}</th>
                {r.map((x, h) => (
                  <td key={h} className="p-px">
                    <button
                      type="button"
                      aria-label={`Layer ${l}, head ${h}: +${x.toFixed(4)}`}
                      onClick={() => setSel([l, h])}
                      className={`block h-4 w-5 rounded-sm ${sel[0] === l && sel[1] === h ? "outline outline-1 outline-amber-400" : ""}`}
                      style={{ backgroundColor: x > 0 ? `rgba(244,63,94,${Math.min(1, x / max + 0.05)})` : "rgba(16,185,129,0.4)" }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Layer {sel[0]}, head {sel[1]}: loss {AB.base_loss.toFixed(3)} → {(AB.base_loss + v).toFixed(3)} ({v >= 0 ? "+" : ""}
        {v.toFixed(4)}). {below} of 144 heads add less than 0.01.
      </p>
      <p className="mt-1 text-xs text-slate-400">Red: the loss rises when the head is removed (darker = more). Green: it falls slightly. Averaged over 8 short sentences.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 6: who shares what */

const KV_OPTIONS = ["32", "8", "4", "1"] as const;
const QH = 32;

/** Lab: which key-value head each of 32 query heads reads (Llama 3 8B's layout). */
export function KvSharingLab() {
  const [kv, setKv] = useState<(typeof KV_OPTIONS)[number]>("8");
  const K = Number(kv);
  const g = QH / K;
  const name = K === QH ? "multi-head attention" : K === 1 ? "multi-query attention" : "grouped-query attention";
  const W = 320;
  const qx = (i: number) => 8 + (i * (W - 16)) / (QH - 1);
  const kx = (k: number) => (K === 1 ? W / 2 : 8 + (k * (W - 16)) / (K - 1));
  return (
    <Panel title="32 query heads, how many key-value heads?">
      <Segmented label="Key-value heads" value={kv} options={KV_OPTIONS.map((v) => ({ value: v, label: v }))} onChange={setKv} />
      <svg viewBox={`0 0 ${W} 90`} role="img" aria-label={`${QH} query heads reading ${K} key-value heads`} className="mt-2 w-full">
        {Array.from({ length: QH }, (_, i) => (
          <line key={i} x1={qx(i)} y1={14} x2={kx(Math.floor(i / g))} y2={74} className="stroke-slate-600" strokeWidth={0.8} />
        ))}
        {Array.from({ length: QH }, (_, i) => (
          <circle key={`q${i}`} cx={qx(i)} cy={10} r={3.2} className="fill-sky-400" />
        ))}
        {Array.from({ length: K }, (_, k) => (
          <rect key={`k${k}`} x={kx(k) - 4} y={74} width={8} height={8} className="fill-amber-400" />
        ))}
      </svg>
      <p role="status" className="mt-1 text-sm text-slate-100">
        {K} key-value head{K === 1 ? "" : "s"} ({name}): {g} query head{g === 1 ? "" : "s"} per key-value head; the cache is {g}× smaller than multi-head.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 6: memory budget */

/** Bytes of KV cache per token for Llama 3 8B's shape (32 layers, head width 128, 16-bit). */
export const llamaKvPerToken = (kvHeads: number) => 2 * 32 * kvHeads * 128 * 2;
const WEIGHTS_GB = (8_030_261_248 * 2) / 1e9;

/** Lab: how many tokens of cache fit next to Llama 3 8B's 16-bit weights on a GPU (computed). */
export function KvBudgetLab() {
  const [gb, setGb] = useState(24);
  const free = Math.max(0, gb - WEIGHTS_GB) * 1e9;
  const mha = Math.floor(free / llamaKvPerToken(32));
  const gq = Math.floor(free / llamaKvPerToken(8));
  return (
    <Panel title="What fits next to Llama 3 8B's weights?">
      <Slider label="GPU memory (GB)" min={16} max={80} step={1} value={gb} onChange={setGb} />
      <div className="mt-2 space-y-1.5">
        <Bar label="multi-head (32 KV heads)" value={mha} max={Math.max(gq, 1)} display={`${fmt(mha)} tokens`} />
        <Bar label="GQA (8 KV heads)" value={gq} max={Math.max(gq, 1)} display={`${fmt(gq)} tokens`} />
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {gb} GB − {WEIGHTS_GB.toFixed(1)} GB of weights leaves room for {fmt(mha)} tokens of cache with multi-head attention, {fmt(gq)} with GQA: {Math.floor(gq / 8192)} conversations of 8,192 tokens.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ step 6: repeat_kv */

/** Lab: the shapes stored in the cache and the shapes each query head attends with. */
export function KvRepeatLab() {
  const [kv, setKv] = useState<(typeof KV_OPTIONS)[number]>("8");
  const K = Number(kv);
  const rep = QH / K;
  const T = 1000;
  return (
    <Panel title="repeat_kv: store few, compare with many">
      <Segmented label="Key-value heads (num_key_value_heads)" value={kv} options={KV_OPTIONS.map((v) => ({ value: v, label: v }))} onChange={setKv} />
      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">Shapes</caption>
        <tbody>
          {[
            ["queries (computed fresh)", `(${QH}, n, 128)`],
            ["keys and values in the cache", `(${K}, ${fmt(T)}, 128) each`],
            [`after repeat_kv(×${rep})`, `(${QH}, ${fmt(T)}, 128) each`],
            ["query head h reads", `KV head h ÷ ${rep}`],
          ].map(([a, b]) => (
            <tr key={a} className="border-t border-slate-800">
              <td className="py-1 text-slate-300">{a}</td>
              <td className="py-1 font-mono text-sky-200">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {K} KV head{K === 1 ? "" : "s"}: the cache holds {fmt(2 * K * T * 128)} numbers per layer for {fmt(T)} tokens; each is repeated {rep}× only at attention time.
      </p>
    </Panel>
  );
}
