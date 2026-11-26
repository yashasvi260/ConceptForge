import { motion } from "framer-motion";
import { Repeat } from "lucide-react";
import { Panel } from "../../../components/ui";
import { PART_TITLES, TRACK, moduleLabel } from "../../../core/track";
import { applySampling } from "../../04-generation-inference/sampling";
import { NEXT } from "../../04-generation-inference/views/GenerationViews";

// Same illustrative logits as Module 04's logits step, so both modules show the same numbers.
const top3 = applySampling(NEXT, { temperature: 1, topK: 0, topP: 1 })
  .slice(0, 3)
  .map((c) => `${c.token.trim()} ${Math.round(c.finalProb * 100)}%`)
  .join(" · ");

const LOOP = [
  { label: "Text", detail: "“The cat sat on the”" },
  { label: "Tokens", detail: "The · cat · sat · on · the" },
  { label: "Vectors", detail: "one list of numbers per token" },
  { label: "Transformer", detail: "mixes in context, layer after layer" },
  { label: "Next-token probabilities", detail: `${top3} … (illustrative)` },
  { label: "Append & repeat", detail: "“The cat sat on the mat”" },
];

export function MapView() {
  return (
    <>
      <Panel title="The loop inside every generative LLM" icon={<Repeat size={14} />}>
        <ol className="grid gap-2 sm:grid-cols-3">
          {LOOP.map((s, i) => (
            <motion.li
              key={s.label}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              className="rounded-lg border border-slate-700 bg-slate-950/60 p-3"
            >
              <div className="text-xs text-slate-500">{i + 1}</div>
              <div className="font-semibold text-slate-100">{s.label}</div>
              <div className="mt-1 font-mono text-xs text-slate-400">{s.detail}</div>
            </motion.li>
          ))}
        </ol>
      </Panel>
      <Panel title="Your learning map">
        <div className="grid gap-3 md:grid-cols-2">
          {([1, 2, 3, 4] as const).map((part) => (
            <section key={part} aria-label={PART_TITLES[part]} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-300">{PART_TITLES[part]}</h4>
              <ul className="mt-2 space-y-1 text-sm">
                {TRACK.filter((m) => m.part === part).map((m) => (
                  <li key={m.id} className={`flex gap-2 ${m.moduleNumber === 1 ? "text-white" : "text-slate-400"}`}>
                    <span className="w-20 shrink-0 font-mono text-xs text-slate-500">{moduleLabel(m.moduleNumber)}</span>
                    {m.title}
                    {m.moduleNumber === 1 && <span className="text-xs text-violet-300">← you are here</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Panel>
    </>
  );
}
