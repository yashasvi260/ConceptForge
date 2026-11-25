import { useState } from "react";
import { Bar, Panel, Segmented, Toggle } from "../../../components/ui";
import { TextBox } from "../../02-tokens-embeddings/views/common";
import { HEADS, attentionMatrix, scoreRow, softmax } from "../attention";
import { AttentionArcs, Heatmap } from "./viz";

export interface AttentionState {
  text: string;
  setText: (t: string) => void;
  tokens: string[];
  focus: number;
  setFocus: (i: number) => void;
  head: number;
  setHead: (h: number) => void;
  causal: boolean;
  setCausal: (c: boolean) => void;
}

function Controls({ s }: { s: AttentionState }) {
  return (
    <Panel title="Controls">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <TextBox label="Sentence" value={s.text} onChange={s.setText} rows={1} maxLength={120} />
        <Segmented label="Head" value={String(s.head)} options={HEADS.map((h) => ({ value: String(h.id), label: `H${h.id + 1}` }))} onChange={(v) => s.setHead(Number(v))} />
        <Toggle label="Causal mask" checked={s.causal} onChange={s.setCausal} description="decoder (on) vs encoder (off)" />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-200">{HEADS[s.head]!.name}:</span> {HEADS[s.head]!.description} Patterns are illustrative (hand-designed heads); the masking and softmax are exact.
      </p>
    </Panel>
  );
}

export function QkvView({ s }: { s: AttentionState }) {
  const [scaled, setScaled] = useState(true);
  const d = 64;
  // Illustrative raw scores (the head's scores multiplied by √d, as if unscaled q·k).
  const raw = scoreRow(s.tokens, s.head, s.focus, s.causal).map((x) => x * Math.sqrt(d) * 0.5);
  const weights = softmax(raw.map((x) => (scaled ? x / Math.sqrt(d) : x)));
  return (
    <>
      <Controls s={s} />
      <Panel title={`Scores for query “${s.tokens[s.focus] ?? ""}” against every key (d = ${d}, illustrative)`}>
        <Toggle label="Scale by √d" checked={scaled} onChange={setScaled} description="divide q·k by √64 = 8 before softmax" />
        <div className="mt-4 space-y-1.5">
          {s.tokens.map((t, j) => (
            <button key={j} type="button" onClick={() => s.setFocus(j)} className="block w-full text-left">
              <Bar label={`${j}: ${t}`} value={weights[j] ?? 0} display={Number.isFinite(raw[j]!) ? `${((weights[j] ?? 0) * 100).toFixed(1)}%` : "masked"} dim={!Number.isFinite(raw[j]!)} color="#34d399" />
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Without scaling, the largest score dominates and the weights become nearly one-hot.</p>
      </Panel>
    </>
  );
}

export function AttentionView({ s }: { s: AttentionState }) {
  const m = attentionMatrix(s.tokens, s.head, s.causal);
  return (
    <>
      <Controls s={s} />
      <Panel title={`Where “${s.tokens[s.focus] ?? ""}” looks (illustrative head)`}>
        <div className="overflow-x-auto">
          <AttentionArcs tokens={s.tokens} weights={m[s.focus] ?? []} focus={s.focus} onFocus={s.setFocus} causal={s.causal} />
        </div>
      </Panel>
      <Panel title="N × N attention heatmap (rows = queries, columns = keys)">
        <Heatmap tokens={s.tokens} matrix={m} focus={s.focus} />
      </Panel>
    </>
  );
}

export function MultiHeadView({ s }: { s: AttentionState }) {
  return (
    <>
      <Controls s={s} />
      <Panel title="Four heads, one sentence (illustrative)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HEADS.map((h) => (
            <button key={h.id} type="button" onClick={() => s.setHead(h.id)} className={`rounded-lg border p-2 text-left ${h.id === s.head ? "border-emerald-500/70 bg-emerald-500/5" : "border-slate-800"}`}>
              <div className="mb-1 text-xs text-slate-300">
                H{h.id + 1} · {h.name}
              </div>
              <Heatmap tokens={s.tokens} matrix={attentionMatrix(s.tokens, h.id, s.causal)} compact />
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Outputs of all heads are concatenated and mixed by a final learned matrix.</p>
      </Panel>
    </>
  );
}
