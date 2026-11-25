import { ArrowRight, Layers, Route, Scale } from "lucide-react";
import { Panel, Stat } from "../../../components/ui";
import { LABELS, TICKETS, TEST_TICKETS } from "../model";

export function IntroView() {
  return (
    <>
      <Panel title="The task: route bank support tickets" icon={<Route size={14} />}>
        <div className="grid gap-2 sm:grid-cols-5">
          {LABELS.map((l) => (
            <div key={l.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
              <div className="font-mono text-sm font-semibold text-slate-100">{l.id}</div>
              <div className="mt-1 text-xs text-slate-400">{TICKETS.filter((t) => t.label === l.id).length} tickets</div>
            </div>
          ))}
        </div>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          {TEST_TICKETS.slice(0, 5).map((t) => (
            <li key={t.id} className="flex justify-between gap-3 border-b border-slate-800 py-1">
              <span>“{t.text}”</span>
              <span className="shrink-0 font-mono text-xs text-slate-500">{t.label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          {TICKETS.length} short tickets written for this lesson: {TICKETS.length - TEST_TICKETS.length} for training, {TEST_TICKETS.length} held back for
          testing.
        </p>
      </Panel>
      <Panel title="Three ways to classify with a pretrained model">
        <div className="grid gap-2 md:grid-cols-3">
          {[
            ["Representation model + head", "MiniLM turns text into a vector; a small trained layer picks the label."],
            ["Zero-shot embeddings", "Compare the ticket's vector with vectors of the label descriptions. No training."],
            ["Generative prompting", "Ask an LLM (gemma4) to answer with the label word."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm">
              <div className="font-semibold text-slate-100">{t}</div>
              <div className="mt-1 text-slate-400">{d}</div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

export function HeadView() {
  const dim = 384;
  const classes = LABELS.length;
  return (
    <Panel title="A classification head on a representation model" icon={<Layers size={14} />}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {[
          ["Ticket text", "“My card was declined…”"],
          ["MiniLM (frozen)", "6 layers, 22.7 M weights"],
          ["Sentence vector", `${dim} numbers`],
          ["Head (trained)", `${classes} × ${dim} weights + ${classes} biases`],
          ["Softmax", `${classes} probabilities`],
        ].map(([t, d], i, arr) => (
          <div key={t} className="flex items-center gap-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="font-semibold text-slate-100">{t}</div>
              <div className="font-mono text-xs text-slate-400">{d}</div>
            </div>
            {i < arr.length - 1 && <ArrowRight size={14} className="text-slate-500" />}
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Stat label="Weights we train" value={(classes * dim + classes).toLocaleString("en-US")} sub="the head only" />
        <Stat label="Weights we keep frozen" value="22.7 M" sub="all of MiniLM" />
        <Stat label="Training time here" value="< 1 s" sub="in your browser" />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        This is “embedding + classifier”: MiniLM stays frozen. Updating MiniLM's own weights too (full fine-tuning) comes in Module 11.
      </p>
    </Panel>
  );
}

export function ChooseView() {
  const rows = [
    ["Needs labelled examples", "yes (tens to thousands)", "no, just label descriptions", "no (a few examples help)"],
    ["Adding a new label", "retrain", "add one description", "edit the prompt"],
    ["Speed per ticket", "milliseconds", "milliseconds", "a forward pass per output token"],
    ["Runs where", "small model, even a browser", "small model, even a browser", "a large model on a GPU or an API"],
    ["Cost at scale", "tiny", "tiny", "pay per token"],
    ["Handles nuance / instructions", "only what the labels taught it", "limited to the descriptions", "best: can follow rules in the prompt"],
  ];
  return (
    <Panel title="Choosing in production" icon={<Scale size={14} />}>
      <table aria-label="Comparison" className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="py-1 font-normal" />
            <th className="py-1 font-normal">Head</th>
            <th className="py-1 font-normal">Zero-shot</th>
            <th className="py-1 font-normal">Generative</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, ...v]) => (
            <tr key={k} className="border-t border-slate-800 align-top">
              <td className="py-1.5 pr-2 text-slate-400">{k}</td>
              {v.map((x, i) => (
                <td key={i} className="py-1.5 pr-2 text-slate-200">
                  {x}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">A common pattern: a cheap head or zero-shot model handles most tickets, and only low-confidence ones go to the LLM.</p>
    </Panel>
  );
}

export function RecapView() {
  return (
    <Panel title="What you can now do">
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
        <li>Put a trained head on top of a frozen representation model and measure it on held-out data.</li>
        <li>Classify with no training at all by comparing against label descriptions (zero-shot).</li>
        <li>Classify by prompting a generative model, and read its real token probability.</li>
        <li>Weigh accuracy, latency, cost and flexibility when choosing between them.</li>
      </ul>
      <p className="mt-3 text-sm text-slate-400">
        Next, Module 05 drops the labels altogether: what if you don't know the categories yet? Clustering finds them from the vectors.
      </p>
    </Panel>
  );
}
