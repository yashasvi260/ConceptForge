/** Concept labs for Module 04, step 1 (from the last vector to logits). All numbers are real GPT-2 small. */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider } from "../../../../components/ui";
import { GEN, fmt, show } from "../../data/gen";

const LM = GEN.lm_head;
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i]!, 0);
const norm = (a: number[]) => Math.sqrt(dot(a, a));
const PROMPT_OPTIONS = GEN.dists.map((d, i) => ({ value: String(i), label: d.prompt }));

/* ------------------------------------------------------------------ the LM head */

/** Lab: GPT-2's real final vector dotted with real embedding rows gives its own logits. */
export function LmHeadLab() {
  const [i, setI] = useState(4);
  const row = LM.rows[i]!;
  const logit = dot(LM.h, row.e);
  const cos = logit / (norm(LM.h) * norm(row.e));
  const params = LM.vocab * LM.d_model;
  return (
    <Panel title={`LM head on GPT-2's real final vector ("${LM.prompt}")`}>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Vocabulary row">
        {LM.rows.map((r, k) => (
          <button key={r.id} type="button" aria-pressed={k === i} onClick={() => setI(k)} className={`rounded px-1.5 py-0.5 font-mono text-xs ${k === i ? "bg-sky-500/30 text-sky-100" : "bg-slate-800 text-slate-300"}`}>
            {show(r.token)}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {LM.rows.map((r) => (
          <Bar key={r.id} label={show(r.token)} value={r.logit - LM.rows[LM.rows.length - 1]!.logit + 0.2} max={LM.rows[0]!.logit - LM.rows[LM.rows.length - 1]!.logit + 0.2} display={r.logit.toFixed(2)} dim={r.id !== row.id} />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        h · e({show(row.token)}) = {logit.toFixed(2)} (GPT-2 says {row.logit.toFixed(2)}); cosine {cos.toFixed(3)}.
      </p>
      <p className="mt-1 text-xs text-slate-400">
        h has length {norm(LM.h).toFixed(1)}. The output matrix is the token-embedding table itself (tied: {String(LM.tied)}), {fmt(LM.vocab)} × {LM.d_model} = {fmt(params)} numbers. Bars are drawn from the 12th-best logit up; all 12 are negative.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ softmax: shift and stability */

/** exp in 32-bit floats, as a GPU would compute it in float32. */
const exp32 = (x: number) => Math.fround(Math.exp(Math.fround(x)));

/** Lab: adding a constant to real logits changes nothing; a naive 32-bit softmax of logits near −130 is NaN. */
export function SoftmaxShiftLab() {
  const [pi, setPi] = useState("2");
  const [shift, setShift] = useState(0);
  const d = GEN.dists[Number(pi)]!;
  const z = d.top.slice(0, 10).map((t) => t.logit + shift);
  const naive = z.map(exp32);
  const naiveSum = naive.reduce((a, b) => Math.fround(a + b), 0);
  const naiveP = naive.map((e) => Math.fround(e / naiveSum));
  const m = Math.max(...z);
  const safe = z.map((v) => Math.exp(v - m));
  const safeSum = safe.reduce((a, b) => a + b, 0);
  const safeP = safe.map((e) => e / safeSum);
  const fmtP = (p: number) => (Number.isNaN(p) ? "NaN" : `${(100 * p).toFixed(1)}%`);
  return (
    <Panel title="Softmax over GPT-2's top 10 logits">
      <Segmented label="Prompt" value={pi} options={PROMPT_OPTIONS} onChange={setPi} />
      <div className="mt-2">
        <Slider label="Add to every logit" min={-50} max={250} step={10} value={shift} onChange={setShift} format={(v) => (v > 0 ? `+${v}` : String(v))} />
      </div>
      <table className="mt-2 w-full text-left text-sm">
        <caption className="sr-only">Naive and safe softmax</caption>
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="font-normal">token</th>
            <th className="text-right font-normal">logit</th>
            <th className="text-right font-normal">naive 32-bit</th>
            <th className="text-right font-normal">subtract the max</th>
          </tr>
        </thead>
        <tbody>
          {d.top.slice(0, 10).map((t, k) => (
            <tr key={t.id} className="border-t border-slate-800">
              <td className="py-0.5 font-mono text-slate-200">{show(t.token)}</td>
              <td className="py-0.5 text-right font-mono text-slate-400">{z[k]!.toFixed(2)}</td>
              <td className="py-0.5 text-right font-mono text-rose-200">{fmtP(naiveP[k]!)}</td>
              <td className="py-0.5 text-right font-mono text-emerald-200">{fmtP(safeP[k]!)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" className="mt-2 text-sm text-slate-100">
        Top token {show(d.top[0]!.token)}: naive 32-bit {fmtP(naiveP[0]!)}, subtract the max {fmtP(safeP[0]!)}.
      </p>
      <p className="mt-1 text-xs text-slate-400">Softmax over these 10 only, so the percentages are larger than over the full vocabulary. 32-bit floats round e^x to 0 below about −103 and to infinity above about +88.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ real distributions */

/** Lab: four real next-token distributions, with entropy and the 90% set over all 50,257 tokens. */
export function RealNextLab() {
  const [pi, setPi] = useState("0");
  const d = GEN.dists[Number(pi)]!;
  const t1 = d.temps.find((t) => t.T === 1)!;
  return (
    <Panel title="GPT-2's real next-token distribution">
      <Segmented label="Prompt" value={pi} options={PROMPT_OPTIONS} onChange={setPi} />
      <div className="mt-3 space-y-1.5">
        {d.top.slice(0, 10).map((t) => (
          <Bar key={t.id} label={show(t.token)} value={t.prob} max={0.3} display={`${(100 * t.prob).toFixed(1)}%`} color="var(--color-emerald-400)" />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {show(d.top[0]!.token)} leads with {(100 * d.top[0]!.prob).toFixed(1)}%; entropy {t1.entropy_bits} bits; {fmt(d.nucleus["0.9"]!)} tokens cover 90%.
      </p>
      <p className="mt-1 text-xs text-slate-400">Top 10 of {fmt(GEN.config.vocab)} shown; the other tokens hold {(100 * d.tail["10"]!).toFixed(1)}% between them.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ every position predicts */

/** Lab: GPT-2's prediction after every prefix of a real sentence, and the loss on the real next token. */
export function EveryPositionLab() {
  const rows = GEN.positions.rows;
  const [i, setI] = useState(9);
  const r = rows[i]!;
  const words = [rows[0]!.prefix_end, ...rows.map((x) => x.actual)];
  const losses = rows.map((x) => -Math.log(x.p_actual));
  const worst = losses.indexOf(Math.max(...losses));
  return (
    <Panel title="Every position predicts (GPT-2 small, real)">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Position">
        {rows.map((x, k) => (
          <button key={k} type="button" aria-pressed={k === i} aria-label={`After ${words.slice(0, k + 1).join("")}`} onClick={() => setI(k)} className={`rounded px-1.5 py-0.5 font-mono text-xs ${k === i ? "bg-amber-500/30 text-amber-100" : "bg-slate-800 text-slate-300"}`}>
            {x.prefix_end.replace(/ /g, "␣")}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {rows.map((x, k) => (
          <Bar key={k} label={`→ ${show(x.actual)}`} value={losses[k]!} max={9} display={`loss ${losses[k]!.toFixed(2)}`} dim={k !== i} color="var(--color-rose-400)" />
        ))}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        After "{words.slice(0, i + 1).join("")}": GPT-2 guessed {show(r.guess)} ({(100 * r.p_guess).toFixed(1)}%); the real next token {show(r.actual)} got {(100 * r.p_actual).toFixed(2)}%, loss {(-Math.log(r.p_actual)).toFixed(2)}.
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Mean loss {GEN.positions.mean_loss}, perplexity {Math.exp(GEN.positions.mean_loss).toFixed(1)}. The costliest token is {show(rows[worst]!.actual)}.
      </p>
    </Panel>
  );
}
