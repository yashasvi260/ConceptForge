import { Plus, Shapes, Tag } from "lucide-react";
import { useState } from "react";
import { Panel, Slider, Stat } from "../../../components/ui";
import { GenerationPanel } from "../../../llm/GenerationPanel";
import { ModelStatus } from "../../../ml/ModelStatus";
import { useEmbeddings } from "../../../ml/useEmbeddings";
import type { Clustering } from "../pipeline";
import { TOPICS, topicPrompt, topicRecording } from "../topics";
import { clusterColor, type Doc, type ExtraDoc, type Params } from "../usePipeline";
import { Scatter } from "./Scatter";

type Run = { docs: Doc[]; xy: [number, number][]; result: Clustering };

function Legend({ result }: { result: Clustering }) {
  return (
    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
      {Array.from({ length: result.clusters }, (_, c) => (
        <span key={c} className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: clusterColor(c) }} /> cluster {c + 1}: {result.keywords[c]?.slice(0, 2).map((w) => w.word).join(", ")}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: clusterColor(-1) }} /> outlier
      </span>
    </div>
  );
}

export function DensityView({ run, minClusterSize }: { run: Run; minClusterSize: number }) {
  const { xy, docs } = run;
  const k = Math.min(minClusterSize, xy.length);
  const core = xy.map((p) => xy.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1])).sort((a, b) => a - b)[k - 1]!);
  const maxCore = Math.max(...core);
  return (
    <Panel title="Density: crowded areas are clusters, empty ones are not" icon={<Shapes size={14} />}>
      <Scatter xy={xy} docs={docs} color={(i) => (core[i]! < maxCore * 0.35 ? "var(--color-emerald-400)" : "var(--color-slate-500)")} size={(i) => 2 + 5 * (1 - core[i]! / maxCore)} />
      <p className="mt-2 text-xs text-slate-500">
        Point size = how crowded its neighbourhood is (distance to its {k}th nearest neighbour, the “core distance”). Big green points sit in dense regions.
      </p>
    </Panel>
  );
}

export function HdbscanView({ run, params, set }: { run: Run; params: Params; set: (p: Partial<Params>) => void }) {
  const { xy, docs, result } = run;
  return (
    <Panel title="HDBSCAN: clusters from density" icon={<Shapes size={14} />}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="min_cluster_size (granularity)" value={params.minClusterSize} min={2} max={20} onChange={(v) => set({ minClusterSize: v })} />
        <Slider
          label="Outlier threshold (GLOSH score)"
          value={params.outlierThreshold}
          min={0.05}
          max={1}
          step={0.05}
          onChange={(v) => set({ outlierThreshold: v })}
          format={(v) => (v >= 1 ? "off" : v.toFixed(2))}
          hint="Points with an outlier score above this are greyed out (1 = only HDBSCAN's own noise)."
        />
      </div>
      <div className="mt-3">
        <Scatter xy={xy} docs={docs} color={(i) => clusterColor(result.isOutlier[i] ? -1 : result.labels[i]!)} />
        <Legend result={result} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Clusters</div>
          <div data-testid="cluster-count" className="font-mono text-lg text-slate-100">
            {result.clusters}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Outliers</div>
          <div data-testid="outlier-count" className="font-mono text-lg text-slate-100">
            {result.isOutlier.filter(Boolean).length}
          </div>
        </div>
        <Stat label="Comments" value={String(docs.length)} />
      </div>
    </Panel>
  );
}

export function KeywordsView({ run }: { run: Run }) {
  const { result } = run;
  return (
    <Panel title="c-TF-IDF: what makes each cluster different" icon={<Tag size={14} />}>
      <ul className="space-y-2">
        {result.keywords.map((words, c) => (
          <li key={c} data-testid="keyword-row" className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: clusterColor(c) }} /> cluster {c + 1} ·{" "}
              {result.labels.filter((l, i) => l === c && !result.isOutlier[i]).length} comments
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {words.map((w) => (
                <span key={w.word} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-200">
                  {w.word} <span className="text-slate-500">{w.score.toFixed(3)}</span>
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function AddDoc({ onAdd }: { onAdd: (d: ExtraDoc) => void }) {
  const model = useEmbeddings();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    if (!model.embedder || !text.trim()) return;
    setBusy(true);
    try {
      const [v] = await model.embedder.embedSentences([text.trim()]);
      onAdd({ id: `you${Date.now()}`, text: text.trim(), vector: Array.from(v!) });
      setText("");
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModelStatus state={model}>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1 text-sm">
          <span className="text-slate-300">Add your own comment</span>
          <input
            aria-label="Add a comment"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200"
          />
        </label>
        <button
          type="button"
          onClick={() => void add()}
          disabled={busy || !text.trim()}
          className="flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
        >
          <Plus size={13} /> Add to the map
        </button>
      </div>
    </ModelStatus>
  );
}

export function NamesView({ run, onAdd }: { run: Run; onAdd: (d: ExtraDoc) => void }) {
  const { docs, result } = run;
  return (
    <Panel title="Naming the topics with an LLM" icon={<Tag size={14} />}>
      <AddDoc onAdd={onAdd} />
      <p className="mt-2 text-xs text-slate-500">
        <span data-testid="doc-total">{docs.length}</span> comments on the map.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {Array.from({ length: result.clusters }, (_, c) => {
          const members = docs.filter((_, i) => result.labels[i] === c && !result.isOutlier[i]);
          const keywords = result.keywords[c]!.map((w) => w.word);
          const prompt = topicPrompt(members, keywords);
          return (
            <div key={c} className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: clusterColor(c) }} /> cluster {c + 1} · {keywords.slice(0, 3).join(", ")}
              </div>
              <GenerationPanel
                title={`Topic name, cluster ${c + 1}`}
                file={TOPICS}
                recording={topicRecording(members, keywords)}
                live={{ request: { model: TOPICS.model, prompt, temperature: 0 } }}
              />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function RecapView() {
  return (
    <Panel title="The BERTopic pipeline you just ran">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">
        <li>Embed every document (MiniLM, 384 numbers each)</li>
        <li>Reduce to a few dimensions (UMAP)</li>
        <li>Cluster by density (HDBSCAN), leaving outliers out</li>
        <li>Describe each cluster with its most distinctive words (c-TF-IDF)</li>
        <li>Optionally, let an LLM turn the words into a readable name</li>
      </ol>
      <p className="mt-3 text-sm text-slate-400">
        So far every model call has used a tiny prompt. Module 06 is about the prompt itself: how its wording, examples and structure change what an LLM gives
        back.
      </p>
    </Panel>
  );
}
