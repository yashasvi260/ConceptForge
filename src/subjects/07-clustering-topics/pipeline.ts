/** The BERTopic-style pipeline used by Module 07: vectors → UMAP 2-D → HDBSCAN → c-TF-IDF keywords. */
import { cTfIdf } from "./ctfidf";
import { hdbscan } from "./hdbscan";
import { project2d } from "./umap";

export const DEFAULTS = { nNeighbors: 12, minDist: 0.1, seed: 42, minClusterSize: 4, outlierThreshold: 1 };

export interface Clustering {
  labels: number[];
  outlierScores: number[];
  /** HDBSCAN noise, plus points whose GLOSH score is above the threshold. */
  isOutlier: boolean[];
  clusters: number;
  keywords: { word: string; score: number }[][];
}

export function layout(vectors: number[][], p: { nNeighbors: number; minDist: number; seed: number }): [number, number][] {
  return project2d(vectors, p);
}

export function cluster(xy: [number, number][], texts: string[], p: { minClusterSize: number; outlierThreshold: number }): Clustering {
  const { labels, outlierScores } = hdbscan(xy, { minClusterSize: p.minClusterSize });
  const clusters = labels.reduce((m, l) => Math.max(m, l + 1), 0);
  const isOutlier = labels.map((l, i) => l === -1 || outlierScores[i]! > p.outlierThreshold);
  const groups = Array.from({ length: clusters }, (_, c) => texts.filter((_, i) => labels[i] === c && !isOutlier[i]));
  const keywords = cTfIdf(groups, 5).map((g) => g.words);
  return { labels, outlierScores, isOutlier, clusters, keywords };
}

/** Recording key for a cluster: its document ids, sorted (so the same group always has the same key). */
export const clusterKey = (ids: string[]) => `topic:${[...ids].sort().join(",")}`;
