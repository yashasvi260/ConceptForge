import { Boxes } from "lucide-react";
import { useState } from "react";
import { Panel, RichText } from "../../../components/ui";
import { MODEL_CONFIGS, fmt } from "../modelConfigs";

const GPT2 = MODEL_CONFIGS.find((c) => c.id === "gpt2-small")!;

interface Part {
  name: string;
  shape: string;
  what: string;
  module: string;
}

/** Shapes use GPT-2 small's published sizes for a 5-token input. */
const PARTS: Part[] = [
  {
    name: "Tokenizer",
    shape: "text → 5 token IDs",
    what: "Chops the text into tokens from a fixed vocabulary and swaps each for its ID number. No learning happens here at run time.",
    module: "Module 02 (Tokens)",
  },
  {
    name: "Embedding table",
    shape: `IDs → 5 × ${GPT2.dModel}`,
    what: `A big table with one row of ${GPT2.dModel} numbers per vocabulary entry (${fmt(GPT2.vocab)} rows in GPT-2). Looking up each ID gives every token its starting vector.`,
    module: "Module 02 (Embeddings)",
  },
  {
    name: "Position information",
    shape: `5 × ${GPT2.dModel} (with order)`,
    what: "Attention on its own ignores order, so each vector is told where it sits: GPT-2 adds a learned position vector; Llama rotates vectors by position (RoPE).",
    module: "Module 03",
  },
  {
    name: "Transformer blocks",
    shape: `${GPT2.layers} × [attention → feed-forward]`,
    what: `The same kind of block stacked ${GPT2.layers} times in GPT-2 small (32 in Llama 3 8B). **Attention** lets each token pull in information from the others; the **feed-forward** network then transforms each vector on its own. This is where almost all the parameters live.`,
    module: "Module 03",
  },
  {
    name: "Output head",
    shape: `last vector → ${fmt(GPT2.vocab)} scores`,
    what: "Turns the final vector of the last token into one score (logit) per vocabulary entry. GPT-2 reuses the embedding table for this; Llama has a separate one.",
    module: "Module 03",
  },
  {
    name: "Next-token choice",
    shape: "scores → probabilities → 1 token",
    what: "Softmax turns the scores into probabilities and a decoding rule (greedy, temperature, top-p) picks one token, which is appended before the whole pass runs again.",
    module: "Module 04 (Decoding)",
  },
];

export function AnatomyView() {
  const [sel, setSel] = useState(3);
  const part = PARTS[sel]!;
  return (
    <Panel title="Anatomy of an LLM (sizes from GPT-2 small)" icon={<Boxes size={14} />}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ol className="space-y-1.5">
          <li className="rounded-md border border-dashed border-slate-700 px-3 py-1.5 font-mono text-xs text-slate-400">“The cat sat on the”</li>
          {PARTS.map((p, i) => (
            <li key={p.name}>
              <button
                type="button"
                aria-label={`Part: ${p.name}`}
                aria-pressed={sel === i}
                onClick={() => setSel(i)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  sel === i ? "border-violet-500/60 bg-violet-500/15 text-white" : "border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-600"
                } ${p.name === "Transformer blocks" ? "border-l-4" : ""}`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="font-mono text-[11px] text-slate-400">{p.shape}</span>
              </button>
            </li>
          ))}
          <li className="rounded-md border border-dashed border-slate-700 px-3 py-1.5 font-mono text-xs text-slate-400">→ “mat” (then repeat)</li>
        </ol>
        <section aria-label="Selected part" className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm">
          <h4 className="text-base font-semibold text-white">{part.name}</h4>
          <p className="font-mono text-xs text-violet-300">{part.shape}</p>
          <p className="leading-relaxed text-slate-300">
            <RichText text={part.what} />
          </p>
          <p className="text-xs text-slate-500">Covered in depth in {part.module}.</p>
        </section>
      </div>
    </Panel>
  );
}
