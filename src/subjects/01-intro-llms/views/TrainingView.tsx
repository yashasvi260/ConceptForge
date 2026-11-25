import { Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Segmented } from "../../../components/ui";
import { TextBox } from "../../02-tokens-embeddings/views/common";
import { words } from "../bow";
import { maskForMlm, nextTokenPairs } from "../pretraining";

type Family = "gpt" | "bert";

export function TrainingView() {
  const [family, setFamily] = useState<Family>("gpt");
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog");
  const [seed, setSeed] = useState(1);
  const toks = words(text).slice(0, 24);
  const masked = useMemo(() => {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return maskForMlm(toks, rnd, ["apple", "river", "seven", "blue"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depends on the words, not the array identity
  }, [toks.join(" "), seed]);

  return (
    <>
      <Panel title="Stage 1 · Pre-training on raw text (no labels needed)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Segmented<Family>
            label="Objective"
            value={family}
            options={[
              { value: "gpt", label: "GPT · next token" },
              { value: "bert", label: "BERT · masked words" },
            ]}
            onChange={setFamily}
          />
          <TextBox label="Training sentence" value={text} onChange={setText} rows={1} maxLength={200} />
        </div>
        {family === "gpt" ? (
          <ol className="mt-4 space-y-1 font-mono text-xs">
            {nextTokenPairs(toks).slice(0, 10).map((p, i) => (
              <li key={i} data-testid="ntp-pair" className="flex flex-wrap gap-2">
                <span className="text-slate-400">{p.context.join(" ")}</span>
                <span className="text-slate-600">→</span>
                <span className="rounded bg-violet-500/25 px-1 text-violet-100">{p.target}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1">
              {masked.map((t, i) => (
                <span
                  key={i}
                  data-testid="mlm-token"
                  data-predict={t.predict}
                  title={t.predict ? `model must predict “${t.original}”` : undefined}
                  className={`rounded px-1.5 py-0.5 font-mono text-sm ${t.predict ? "bg-amber-500/25 text-amber-100" : "bg-slate-800 text-slate-300"}`}
                >
                  {t.shown}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSeed((s) => s + 1)}
              className="mt-3 flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              <Shuffle size={13} /> Mask again
            </button>
            <p className="mt-2 text-xs text-slate-500">
              Amber = a chosen position the model must predict (15% of tokens: 80% shown as [MASK], 10% a random word, 10% unchanged).
            </p>
          </div>
        )}
      </Panel>
      <Panel title="Stage 2 · Fine-tuning on a task">
        <ol className="grid gap-2 text-sm sm:grid-cols-3">
          <li className="rounded-lg bg-slate-950/60 p-3">
            <div className="font-semibold text-slate-100">Pre-trained model</div>
            <div className="text-xs text-slate-400">general language knowledge, learned once at great cost</div>
          </li>
          <li className="rounded-lg bg-slate-950/60 p-3">
            <div className="font-semibold text-slate-100">+ small labelled dataset</div>
            <div className="text-xs text-slate-400">e.g. reviews tagged positive/negative, or instruction–answer pairs</div>
          </li>
          <li className="rounded-lg bg-slate-950/60 p-3">
            <div className="font-semibold text-slate-100">= task model</div>
            <div className="text-xs text-slate-400">a classifier, or a helpful chat assistant (Part III)</div>
          </li>
        </ol>
      </Panel>
    </>
  );
}
