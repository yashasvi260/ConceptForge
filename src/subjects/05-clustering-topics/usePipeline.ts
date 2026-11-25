import { useMemo } from "react";
import data from "./data/docs.json";
import emb from "./data/doc-embeddings.json";
import layoutFile from "./data/default-layout.json";
import { DEFAULTS, cluster, layout, type Clustering } from "./pipeline";

export interface Doc {
  id: string;
  text: string;
  theme: string;
}

export const DOCS = data.docs as Doc[];
export const DOC_VECTORS = emb.vectors as number[][];
export const DEFAULT_XY = layoutFile.xy as [number, number][];

export interface Params {
  nNeighbors: number;
  minDist: number;
  minClusterSize: number;
  outlierThreshold: number;
}
export const DEFAULT_PARAMS: Params = {
  nNeighbors: DEFAULTS.nNeighbors,
  minDist: DEFAULTS.minDist,
  minClusterSize: DEFAULTS.minClusterSize,
  outlierThreshold: DEFAULTS.outlierThreshold,
};

export interface ExtraDoc {
  id: string;
  text: string;
  vector: number[];
}

/** Runs the pipeline for the current settings. Default settings reuse the shipped layout (see steps). */
export function usePipeline(params: Params, extras: ExtraDoc[]) {
  const docs = useMemo(() => [...DOCS, ...extras.map((e) => ({ id: e.id, text: e.text, theme: "yours" }))], [extras]);
  const isDefaultLayout = extras.length === 0 && params.nNeighbors === DEFAULTS.nNeighbors && params.minDist === DEFAULTS.minDist;
  const xy = useMemo(
    () =>
      isDefaultLayout
        ? DEFAULT_XY
        : layout([...DOC_VECTORS, ...extras.map((e) => e.vector)], { nNeighbors: params.nNeighbors, minDist: params.minDist, seed: DEFAULTS.seed }),
    [isDefaultLayout, extras, params.nNeighbors, params.minDist],
  );
  const result: Clustering = useMemo(
    () => cluster(xy, docs.map((d) => d.text), { minClusterSize: params.minClusterSize, outlierThreshold: params.outlierThreshold }),
    [xy, docs, params.minClusterSize, params.outlierThreshold],
  );
  return { docs, xy, result, isDefaultLayout };
}

const PALETTE = ["sky", "emerald", "amber", "violet", "rose", "cyan"];
export const clusterColor = (c: number) => (c < 0 ? "var(--color-slate-600)" : `var(--color-${PALETTE[c % PALETTE.length]}-400)`);
export const THEMES = [...new Set(DOCS.map((d) => d.theme))];
export const themeColor = (t: string) => (t === "other" || t === "yours" ? "var(--color-slate-500)" : clusterColor(THEMES.indexOf(t)));
