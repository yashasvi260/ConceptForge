import { Bot, Sigma } from "lucide-react";
import { useState } from "react";
import { Bar, Panel } from "../../../components/ui";
import { LongInputNote, ModelRunError, ModelStatus } from "../../../ml/ModelStatus";
import { useEmbeddings } from "../../../ml/useEmbeddings";
import { useModelRun } from "../../../ml/useModelRun";
import { cosine } from "../../../ml/vector";
import { TextBox } from "../../02-tokens-embeddings/views/common";

export const LABELS = ["This is a positive review.", "This is a negative review."];

export function RepGenView() {
  const model = useEmbeddings();
  const [text, setText] = useState("This movie was fantastic, I loved every minute!");
  const e = model.embedder;
  const run = useModelRun(
    e && text.trim() ? () => e.embedSentences([text, ...LABELS]).then(([t, ...ls]) => ls.map((l) => cosine(t!, l))) : null,
    text,
  );
  const scores = run.value;

  const winner = scores ? (scores[0]! >= scores[1]! ? "positive" : "negative") : null;
  return (
    <>
      <Panel title="Your input">
        <TextBox label="Review" value={text} onChange={setText} rows={2} maxLength={400} />
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Representation model (real: MiniLM)" icon={<Sigma size={14} />}>
          <ModelStatus state={model}>
            {run.error && <ModelRunError />}
            <LongInputNote show={!!e && e.isTruncated(text)} />
            <p className="text-sm text-slate-300">Embed the review and two label descriptions, then compare vectors:</p>
            <div className="mt-3 space-y-1.5" data-testid="label-scores">
              {LABELS.map((l, i) => (
                <Bar key={l} label={i === 0 ? "positive" : "negative"} value={Math.max(0, scores?.[i] ?? 0)} display={scores ? scores[i]!.toFixed(2) : "…"} />
              ))}
            </div>
            {winner && (
              <p className="mt-3 text-sm text-slate-200">
                Closest description: <strong>{winner}</strong>. No training, no text generated: just vectors and cosine similarity.
              </p>
            )}
          </ModelStatus>
        </Panel>
        <Panel title="Generative model (illustrative)" icon={<Bot size={14} />}>
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300">
{`Prompt: Is this review positive or negative? Answer with one word.
Review: ${text}
Answer:`}
          </pre>
          <p className="mt-2 text-sm text-slate-300">
            A chat model would continue the text with a word such as <em>Positive</em>. Flexible (any task you can describe), but every
            answer costs a full generation.
          </p>
        </Panel>
      </div>
      <p className="text-xs text-slate-500">Module 04 compares these approaches properly: fine-tuned heads, zero-shot embeddings and prompting.</p>
    </>
  );
}
