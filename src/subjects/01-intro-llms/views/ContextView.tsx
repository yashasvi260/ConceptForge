import { useState } from "react";
import { Panel, Stat } from "../../../components/ui";
import { ModelRunError, ModelStatus } from "../../../ml/ModelStatus";
import { useEmbeddings } from "../../../ml/useEmbeddings";
import { useModelRun } from "../../../ml/useModelRun";
import { cosine } from "../../../ml/vector";
import { TextBox } from "../../02-tokens-embeddings/views/common";

export function ContextView() {
  const model = useEmbeddings();
  const [a, setA] = useState("The bank approved the loan");
  const [b, setB] = useState("The river bank flooded");
  const e = model.embedder;
  const run = useModelRun(e ? () => Promise.all([e.embedTokens(a), e.embedTokens(b)]) : null, `${a}|${b}`);
  const sim: number | null | "missing" = run.value
    ? (() => {
        const [x, y] = run.value;
        const i = x.tokens.indexOf("bank");
        const j = y.tokens.indexOf("bank");
        return i < 0 || j < 0 ? "missing" : cosine(x.vectors[i]!, y.vectors[j]!);
      })()
    : null;

  return (
    <>
      <Panel title="Same word, two sentences">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextBox label="Sentence A" value={a} onChange={setA} rows={1} maxLength={200} />
          <TextBox label="Sentence B" value={b} onChange={setB} rows={1} maxLength={200} />
        </div>
      </Panel>
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Bag-of-Words view of “bank”">
          <p className="text-sm text-slate-300">
            One column called <code className="font-mono">bank</code>, value 1 in both sentences. Identical: no way to tell money from
            rivers.
          </p>
        </Panel>
        <Panel title="MiniLM's contextual vectors for “bank”">
          <ModelStatus state={model}>
            {run.error && <ModelRunError />}
            {sim === "missing" ? (
              <p className="text-sm text-amber-200">Type the word bank in both sentences.</p>
            ) : (
              <Stat label="Similarity of the two bank vectors" value={sim === null ? "…" : sim.toFixed(2)} sub="1.00 would mean identical" />
            )}
          </ModelStatus>
        </Panel>
      </div>
      <p className="text-xs text-slate-500">
        Module 02 explores this shift in depth; Module 03 shows the attention mechanism that causes it.
      </p>
    </>
  );
}
