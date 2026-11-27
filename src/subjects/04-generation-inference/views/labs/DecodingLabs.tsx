/** Concept labs for Module 04, step 2 (greedy, temperature, sampling, beam search). Real GPT-2 small unless labelled. */
import { useState } from "react";
import { Bar, Panel, Segmented, Slider } from "../../../../components/ui";
import { GEN, fmt, probAt, show } from "../../data/gen";

/* ------------------------------------------------------------------ greedy loops */

/** Indices of tokens that belong to a run of n tokens which already appeared earlier in the text. */
export function repeatedTokens(tokens: string[], n = 4): Set<number> {
  const seen = new Map<string, number>();
  const out = new Set<number>();
  for (let i = 0; i + n <= tokens.length; i++) {
    const key = tokens.slice(i, i + n).join("\u0000");
    const first = seen.get(key);
    if (first !== undefined && first + n <= i) for (let k = i; k < i + n; k++) out.add(k);
    else if (first === undefined) seen.set(key, i);
  }
  return out;
}

const GREEDY_OPTIONS = Object.keys(GEN.greedy).map((p) => ({ value: p, label: p }));

/** Lab: GPT-2's real greedy continuations, with repeated phrases marked. */
export function GreedyLoopLab() {
  const [p, setP] = useState(GREEDY_OPTIONS[0]!.value);
  const g = GEN.greedy[p]!;
  const rep = repeatedTokens(g.tokens);
  return (
    <Panel title="Greedy decoding, 40 tokens (GPT-2 small, real)">
      <Segmented label="Prompt" value={p} options={GREEDY_OPTIONS} onChange={setP} />
      <p className="mt-3 text-sm leading-7">
        <span className="text-slate-400">{p}</span>
        {g.tokens.map((t, i) => (
          <span key={i} className={rep.has(i) ? "rounded bg-rose-500/25 text-rose-100" : "text-slate-100"}>
            {t.replace(/\n/g, "↵ ")}
          </span>
        ))}
      </p>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {rep.size} of {g.tokens.length} tokens repeat a 4-token phrase written earlier; every token was the model's top choice; log-probability {g.logprob}.
      </p>
      <p className="mt-1 text-xs text-slate-400">Highlighted: tokens inside a 4-token run that already appeared earlier in the continuation.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ temperature */

const PROMPT_OPTIONS = GEN.dists.map((d, i) => ({ value: String(i), label: d.prompt }));

/** Lab: temperature on a real distribution, normalised over the full 50,257-token vocabulary. */
export function TemperatureLab() {
  const [pi, setPi] = useState("1");
  const [T, setT] = useState(1);
  const d = GEN.dists[Number(pi)]!;
  const t = Math.round(T * 10) / 10;
  const s = d.temps.find((x) => Math.abs(x.T - t) < 1e-9)!;
  return (
    <Panel title="Temperature on GPT-2's real distribution">
      <Segmented label="Prompt" value={pi} options={PROMPT_OPTIONS} onChange={setPi} />
      <div className="mt-2">
        <Slider label="Temperature" min={0.1} max={2} step={0.1} value={t} onChange={setT} format={(v) => v.toFixed(1)} />
      </div>
      <div className="mt-3 space-y-1.5" data-testid="temp-bars">
        {d.top.slice(0, 10).map((x) => {
          const p = probAt(d, x.logit, t);
          return <Bar key={x.id} label={show(x.token)} value={p} max={1} display={`${(100 * p).toFixed(1)}%`} color="var(--color-emerald-400)" />;
        })}
      </div>
      <p role="status" className="mt-2 text-sm text-slate-100">
        T = {t.toFixed(1)}: {show(d.top[0]!.token)} has {(100 * s.top1).toFixed(1)}%; entropy {s.entropy_bits} bits; {fmt(s.nucleus90)} token{s.nucleus90 === 1 ? "" : "s"} cover 90%.
      </p>
      <p className="mt-1 text-xs text-slate-400">Probabilities over all {fmt(GEN.config.vocab)} tokens at each temperature; the ranking never changes.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ seeded samples */

const UNTRUNCATED = ["T=0.3", "T=0.7", "T=1.0", "T=1.5"] as const;
const SEEDS = ["0", "1", "2"] as const;

const rankClass = (r: number) => (r > 100 ? "rounded bg-rose-500/30 text-rose-100" : r > 10 ? "rounded bg-amber-500/20 text-amber-100" : "text-slate-100");

/** Lab: real seeded samples at four temperatures, each token coloured by its rank under the model. */
export function TempSamplesLab() {
  const [setting, setSetting] = useState<(typeof UNTRUNCATED)[number]>("T=1.0");
  const [seed, setSeed] = useState<(typeof SEEDS)[number]>("0");
  const s = GEN.samples.find((x) => x.setting === setting && x.seed === Number(seed))!;
  const outside = s.ranks.filter((r) => r > 100).length;
  return (
    <Panel title={`Sampling from "${GEN.sample_prompt}" (GPT-2 small, real)`}>
      <div className="grid gap-2 sm:grid-cols-2">
        <Segmented label="Temperature" value={setting} options={UNTRUNCATED.map((v) => ({ value: v, label: v.replace("T=", "") }))} onChange={setSetting} />
        <Segmented label="Seed" value={seed} options={SEEDS.map((v) => ({ value: v, label: v }))} onChange={setSeed} />
      </div>
      <p className="mt-3 text-sm leading-7">
        {s.tokens.map((t, i) => (
          <span key={i} className={rankClass(s.ranks[i]!)} title={`rank ${fmt(s.ranks[i]!)}`}>
            {t.replace(/\n/g, "↵ ")}
          </span>
        ))}
      </p>
      <p role="status" className="mt-2 text-sm text-slate-100">
        {setting}, seed {seed}: {outside} of 30 tokens ranked outside the top 100 (worst {fmt(Math.max(...s.ranks))}); log-probability {s.logprob}.
      </p>
      <p className="mt-1 text-xs text-slate-400">Colour = the token's rank in the model's untempered distribution: amber 11–100, red beyond 100. Hover a token for its rank.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ beam search */

/** The same made-up table as the Build it exercise (not a real model). */
export const TOY: Record<string, Record<string, number>> = {
  A: { B: 0.5, C: 0.4, D: 0.1 },
  "A B": { x: 0.3, y: 0.3, z: 0.4 },
  "A C": { x: 0.9, y: 0.1 },
  "A D": { x: 1.0 },
};

export interface Beam { seq: string[]; p: number }

/** Beam search on TOY for `steps` steps; returns the kept beams after each step, best first. */
export function toyBeam(width: number, steps = 2): Beam[][] {
  let beams: Beam[] = [{ seq: ["A"], p: 1 }];
  const history: Beam[][] = [];
  for (let s = 0; s < steps; s++) {
    const grown = beams.flatMap((b) => Object.entries(TOY[b.seq.join(" ")] ?? {}).map(([t, q]) => ({ seq: [...b.seq, t], p: b.p * q })));
    beams = grown.sort((a, b) => b.p - a.p).slice(0, width);
    history.push(beams);
  }
  return history;
}

const WIDTHS = ["1", "2", "3"] as const;

/** Lab: greedy vs beam search on real GPT-2, plus a toy beam search you can widen. */
export function BeamLab() {
  const [w, setW] = useState<(typeof WIDTHS)[number]>("1");
  const hist = toyBeam(Number(w));
  const best = hist[hist.length - 1]![0]!;
  const g = GEN.greedy["The cat sat on the"]!;
  const b = GEN.beam;
  return (
    <Panel title="Beam search">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Greedy and beam search on GPT-2</caption>
        <tbody>
          {[
            ["greedy", g],
            ["5 beams", b],
          ].map(([label, c]) => {
            const x = c as typeof g;
            return (
              <tr key={label as string} className="border-t border-slate-800 align-top">
                <td className="py-1 pr-2 text-slate-300">{label as string}</td>
                <td className="py-1 text-slate-200">{x.text.replace(/\n/g, " ").slice(0, 70)}…</td>
                <td className="py-1 pl-2 text-right font-mono text-sky-200">{x.logprob}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-slate-400">
        Real GPT-2, "The cat sat on the", 40 tokens; last column is the total log-probability. The beam's text is about {fmt(Math.round(Math.exp(b.logprob - g.logprob) / 10) * 10)}× more likely than greedy's.
      </p>
      <div className="mt-4 border-t border-slate-800 pt-3">
        <Segmented label="Beams on a made-up table (not a real model)" value={w} options={WIDTHS.map((v) => ({ value: v, label: v }))} onChange={setW} />
        <ol className="mt-2 space-y-1 text-sm">
          {hist.map((beams, s) => (
            <li key={s} className="text-slate-300">
              step {s + 1}: {beams.map((x) => `${x.seq.join(" ")} (${x.p.toFixed(2)})`).join(", ")}
            </li>
          ))}
        </ol>
        <p role="status" className="mt-2 text-sm text-slate-100">
          {w} beam{w === "1" ? "" : "s"}: best sequence {best.seq.join(" ")} with probability {best.p.toFixed(2)}.
        </p>
      </div>
    </Panel>
  );
}
