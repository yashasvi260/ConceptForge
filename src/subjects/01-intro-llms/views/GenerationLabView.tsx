import { FastForward, Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Panel, Slider } from "../../../components/ui";
import {
  STAGES,
  choicesAt,
  coverage,
  initialLab,
  labStep,
  pickToken,
  type LabState,
  type StopReason,
} from "../generationLab";

import { loadGenRecording as loadRecording, pct, showToken as show, type GenRecording } from "./labkit";

export type { GenRecording };

const STOP_TEXT: Record<StopReason, string> = {
  "model-ended": "Loop stopped: gemma4 produced its end-of-turn token, so the reply is finished.",
  "max-tokens": "Loop stopped: the max-new-tokens limit was reached. The model would have kept going.",
  "not-recorded": "Loop stopped: none of the recorded gemma4 replies continued past this point. Reset or choose another branch.",
};

const AUTO_MS = 550;

export function GenerationLabView({ load = loadRecording, rand = Math.random }: { load?: () => Promise<GenRecording>; rand?: () => number }) {
  const [rec, setRec] = useState<GenRecording | null>(null);
  const [failed, setFailed] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [temperature, setTemperature] = useState(1);
  const [maxTokens, setMaxTokens] = useState(8);
  const [lab, setLab] = useState<LabState>(initialLab);
  const [auto, setAuto] = useState(false);
  const randRef = useRef(rand);
  randRef.current = rand;

  useEffect(() => {
    let live = true;
    load()
      .then((r) => live && setRec(r))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [load]);

  const tree = rec?.trees[promptIndex];
  const opts = useMemo(() => ({ temperature, maxTokens, rand: () => randRef.current() }), [temperature, maxTokens]);
  const step = () => tree && setLab((s) => labStep(s, tree, opts));
  const fullToken = () => {
    if (!tree) return;
    setLab((s) => {
      let n = labStep(s, tree, opts);
      while (n.stage !== 4 && !n.stopped) n = labStep(n, tree, opts);
      return n.stopped ? n : labStep(n, tree, opts);
    });
  };
  const reset = () => {
    setAuto(false);
    setLab(initialLab());
  };

  useEffect(() => {
    if (!auto || !tree) return;
    if (lab.stopped) {
      setAuto(false);
      return;
    }
    const id = window.setTimeout(() => setLab((s) => labStep(s, tree, opts)), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [auto, lab, tree, opts]);

  if (failed) return <Panel title="Generation loop lab"><p className="text-sm text-rose-300">Couldn't load the recorded gemma4 replies.</p></Panel>;
  if (!rec || !tree) return <Panel title="Generation loop lab"><p role="status" className="text-sm text-slate-400">Loading real gemma4 probabilities…</p></Panel>;

  // The probability list shows the last forward pass's distribution until the next pass replaces it.
  const scoredNode = lab.scored;
  const choosing = (lab.stage === 1 || lab.stage === 2) && !lab.stopped;
  const choices = scoredNode === null ? [] : choicesAt(tree, scoredNode, temperature).slice(0, 8);
  const cover = scoredNode === null ? 0 : coverage(tree, scoredNode);
  const promptWords = tree.prompt.split(" ");
  const btn = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="space-y-4">
      <Panel title="Generation loop lab">
        <p className="text-sm text-slate-400">
          Step through next-token prediction with <span className="font-medium text-slate-200">real probabilities from {rec.model}</span>{" "}
          (recorded {rec.recordedAt}): feed context → score → choose → append → repeat.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex min-w-0 flex-col gap-1 text-xs text-slate-400">
            Prompt
            <select
              value={promptIndex}
              onChange={(e) => {
                setPromptIndex(Number(e.target.value));
                reset();
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            >
              {rec.trees.map((t, i) => (
                <option key={t.prompt} value={i}>
                  “{t.prompt}”
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={step} disabled={!!lab.stopped || auto} className={`${btn} border-violet-500 bg-violet-500/10 text-violet-200`}>
            <StepForward size={14} aria-hidden="true" /> Next micro-step
          </button>
          <button type="button" onClick={fullToken} disabled={!!lab.stopped || auto} className={`${btn} border-slate-700 text-slate-200`}>
            <FastForward size={14} aria-hidden="true" /> Full token (+1)
          </button>
          <button type="button" onClick={() => setAuto((a) => !a)} disabled={!!lab.stopped} className={`${btn} border-slate-700 text-slate-200`}>
            {auto ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />} {auto ? "Pause" : "Auto-run"}
          </button>
          <button type="button" onClick={reset} className={`${btn} border-slate-700 text-slate-200`}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Slider label="Temperature" min={0} max={2} step={0.1} value={temperature} onChange={setTemperature} format={(v) => (v === 0 ? "0 (greedy)" : v.toFixed(1))} />
          <Slider label="Max new tokens" min={1} max={12} step={1} value={maxTokens} onChange={setMaxTokens} format={(v) => String(v)} />
        </div>
      </Panel>

      <ol aria-label="The five stages" className="grid gap-2 sm:grid-cols-5">
        {STAGES.map((s, i) => {
          const active = i === lab.stage;
          return (
            <li
              key={s.title}
              aria-current={active ? "step" : undefined}
              className={`rounded-xl border p-3 transition ${active ? "border-violet-500 bg-violet-500/10" : "border-slate-800 bg-slate-950/40"}`}
            >
              <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-violet-300">Stage {i + 1}</div>
              <div className="mt-1 text-sm font-semibold text-slate-100">{s.title}</div>
              <div className="mt-1 text-xs leading-snug text-slate-400">{s.detail}</div>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Context window (prompt + reply so far)">
          <div aria-label="Context window" className="flex min-h-[64px] flex-wrap gap-1.5 rounded-lg border border-slate-800 bg-slate-950/50 p-2">
            {promptWords.map((w, i) => (
              <span key={`p${i}`} className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-xs text-slate-300">
                {w}
              </span>
            ))}
            {lab.generated.map((t, i) => (
              <span key={`g${i}`} className="rounded border border-emerald-500/60 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-xs text-emerald-200">
                {show(t)}
              </span>
            ))}
            {lab.stage === 2 && lab.chosen !== null && (
              <span className="rounded border border-dashed border-violet-400 px-1.5 py-0.5 font-mono text-xs text-violet-200">{show(lab.chosen)}</span>
            )}
            {lab.stopped === "model-ended" && (
              <span className="rounded border border-rose-400/60 bg-rose-500/10 px-1.5 py-0.5 font-mono text-xs text-rose-200">end of turn</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Grey: your prompt. Green: tokens gemma4 generated. ␣ marks a space that belongs to the token.</p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["Forward passes", lab.forwardPasses],
              ["Generated tokens", lab.generated.length],
              ["Token limit", maxTokens],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
                <dt className="text-[11px] text-slate-500">{k}</dt>
                <dd className="font-mono text-lg font-semibold text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
          <div role="status" className={`mt-3 rounded-lg border p-2.5 text-sm ${lab.stopped ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200" : "border-slate-800 text-slate-300"}`}>
            {lab.stopped ? STOP_TEXT[lab.stopped] : `Stage ${lab.stage + 1}: ${STAGES[lab.stage]!.detail}`}
          </div>
        </Panel>

        <Panel title="Next-token probabilities">
          {choices.length === 0 ? (
            <p className="text-sm text-slate-500">Press <span className="font-medium text-slate-300">Next micro-step</span> to run a forward pass and see gemma4's scores for the next token.</p>
          ) : (
            <>
              <ul className="space-y-1.5">
                {choices.map((c) => {
                  const chosen = lab.chosen === c.token;
                  return (
                    <li key={c.token}>
                      <button
                        type="button"
                        disabled={!c.recorded || !choosing}
                        onClick={() => setLab((s) => pickToken(s, tree, c.token))}
                        aria-label={`Pick ${show(c.token)} (${pct(c.adjusted)})`}
                        title={c.recorded ? "Pick this token" : "No recorded gemma4 reply took this branch"}
                        className={`grid w-full grid-cols-[minmax(0,7rem)_1fr_3.5rem] items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition disabled:cursor-not-allowed ${
                          chosen ? "border-emerald-500 bg-emerald-500/10" : "border-slate-800 hover:border-slate-600"
                        } ${c.recorded ? "" : "opacity-50"}`}
                      >
                        <span className="truncate font-mono text-sm text-slate-100">{show(c.token)}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <span className="block h-full rounded-full bg-violet-500" style={{ width: `${Math.max(1, c.adjusted * 100)}%` }} />
                        </span>
                        <span className="text-right font-mono text-xs text-slate-300">{pct(c.adjusted)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {!choosing && (
                <p className="mt-2 text-xs text-slate-400">
                  The last forward pass's scores{lab.generated.length > 0 ? `, which produced ${show(lab.generated[lab.generated.length - 1]!)}` : ""}.
                  {lab.stopped ? " Reset to run the loop again." : " The next forward pass will replace them."}
                </p>
              )}
              <p className="mt-2 text-[11px] leading-snug text-slate-500">
                {temperature === 1 ? "gemma4's real probabilities." : `Real probabilities re-weighted by temperature ${temperature.toFixed(1)}.`} Faded tokens are real
                options no recorded reply took; sampling picks among the recorded ones, which hold {pct(cover)} of the probability here.
              </p>
            </>
          )}
        </Panel>
      </div>

      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
        <span className="font-semibold">Key idea: </span>the model never plans the whole reply. Every token costs one full forward pass, and once a token is appended it cannot be
        taken back; everything after it has to follow from it.
      </div>
    </div>
  );
}
