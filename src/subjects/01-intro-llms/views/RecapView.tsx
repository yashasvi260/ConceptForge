import { CheckCircle2 } from "lucide-react";
import { Panel } from "../../../components/ui";
import { WhereThisFits } from "../../../components/WhereThisFits";

const POINTS = [
  "Text becomes tokens, and tokens become vectors (Module 02).",
  "The transformer mixes context into every vector with attention (Module 03).",
  "The model scores every possible next token and picks one, again and again.",
  "Encoders understand (vectors); decoders generate (text); encoder-decoders do both.",
  "Pre-train once on raw text; fine-tune cheaply for each task (Part III).",
];

export function RecapView() {
  return (
    <Panel title="What you now know">
      <ul className="space-y-2">
        {POINTS.map((p) => (
          <li key={p} className="flex gap-2 text-sm text-slate-200">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" /> {p}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <WhereThisFits moduleNumber={2} />
        <p className="mt-2 text-xs text-slate-500">Next stop, highlighted above: tokens and embeddings.</p>
      </div>
    </Panel>
  );
}
