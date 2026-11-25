import { Map as MapIcon, Ruler, Waves } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Slider, Stat } from "../../../components/ui";
import { cosine } from "../../../ml/vector";
import { DOCS, DOC_VECTORS, THEMES, themeColor, type Doc } from "../usePipeline";
import { Scatter } from "./Scatter";

export function IntroView() {
  return (
    <Panel title={`${DOCS.length} customer comments, no labels`}>
      <ul className="max-h-72 space-y-1 overflow-y-auto pr-1 text-sm text-slate-300">
        {DOCS.filter((_, i) => i % 3 === 0).map((d) => (
          <li key={d.id} className="border-b border-slate-800 py-1">
            “{d.text}”
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-500">
        Short comments written for this lesson. Unlike Module 04, nobody has said what the categories are: the pipeline has to find them.
      </p>
    </Panel>
  );
}

export function EmbedView() {
  const [id, setId] = useState(DOCS[0]!.id);
  const i = DOCS.findIndex((d) => d.id === id);
  const nearest = DOCS.map((d, j) => ({ d, s: cosine(DOC_VECTORS[i]!, DOC_VECTORS[j]!) }))
    .filter((x) => x.d.id !== id)
    .sort((a, b) => b.s - a.s)
    .slice(0, 5);
  return (
    <Panel title="Each comment becomes a 384-number vector" icon={<Waves size={14} />}>
      <select aria-label="Comment" value={id} onChange={(e) => setId(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200">
        {DOCS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.text}
          </option>
        ))}
      </select>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-500">Nearest comments by cosine similarity (real MiniLM vectors)</p>
      <ul className="mt-1 space-y-1 text-sm">
        {nearest.map(({ d, s }) => (
          <li key={d.id} className="flex justify-between gap-3 border-b border-slate-800 py-1 text-slate-300">
            <span>“{d.text}”</span>
            <span className="shrink-0 font-mono text-xs text-slate-400">{s.toFixed(3)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function CurseView() {
  const sims = useMemo(() => {
    const out: number[] = [];
    for (let a = 0; a < DOC_VECTORS.length; a++) for (let b = a + 1; b < DOC_VECTORS.length; b++) out.push(cosine(DOC_VECTORS[a]!, DOC_VECTORS[b]!));
    return out.sort((x, y) => x - y);
  }, []);
  const bins = 20;
  const lo = -0.2;
  const hi = 1;
  const hist = new Array<number>(bins).fill(0);
  for (const s of sims) hist[Math.min(bins - 1, Math.max(0, Math.floor(((s - lo) / (hi - lo)) * bins)))]!++;
  const max = Math.max(...hist);
  const q = (p: number) => sims[Math.floor(p * (sims.length - 1))]!;
  return (
    <Panel title="Why squash 384 dimensions into 2?" icon={<Ruler size={14} />}>
      <div className="flex h-32 items-end gap-0.5" role="img" aria-label="Histogram of pairwise cosine similarities">
        {hist.map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-sky-500/70" style={{ height: `${(h / max) * 100}%` }} title={`${(lo + (i / bins) * (hi - lo)).toFixed(2)}: ${h} pairs`} />
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
        <span>{lo}</span>
        <span>cosine similarity</span>
        <span>{hi}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Pairs" value={sims.length.toLocaleString("en-US")} />
        <Stat label="Median similarity" value={q(0.5).toFixed(2)} />
        <Stat label="Middle 80%" value={`${q(0.1).toFixed(2)} – ${q(0.9).toFixed(2)}`} />
      </div>
      <p className="mt-2 text-xs text-slate-500">Computed live from all pairs of the {DOCS.length} real MiniLM vectors.</p>
    </Panel>
  );
}

export function UmapView({
  xy,
  docs,
  nNeighbors,
  minDist,
  set,
}: {
  xy: [number, number][];
  docs: Doc[];
  nNeighbors: number;
  minDist: number;
  set: (p: { nNeighbors?: number; minDist?: number }) => void;
}) {
  return (
    <Panel title="UMAP: a 2-D map that keeps neighbours together" icon={<MapIcon size={14} />}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="n_neighbors (how local)" value={nNeighbors} min={3} max={30} onChange={(v) => set({ nNeighbors: v })} />
        <Slider label="min_dist (how tightly packed)" value={minDist} min={0} max={0.9} step={0.05} onChange={(v) => set({ minDist: v })} format={(v) => v.toFixed(2)} />
      </div>
      <div className="mt-3">
        <Scatter xy={xy} docs={docs} color={(i) => themeColor(docs[i]!.theme)} />
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
        {THEMES.map((t) => (
          <span key={t} className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: themeColor(t) }} /> {t}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Colours show the hidden theme each comment was written for, so you can judge the map. UMAP and the clustering never see them. Layout computed with
        umap-js (seed 42).
      </p>
    </Panel>
  );
}
