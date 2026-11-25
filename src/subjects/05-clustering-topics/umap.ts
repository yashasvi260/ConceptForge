import { UMAP } from "umap-js";
import { mulberry32 } from "./random";

/** UMAP down to 2-D with a seeded random source, so the same vectors always give the same picture. */
export function project2d(vectors: number[][], opts: { nNeighbors: number; minDist: number; seed: number }): [number, number][] {
  if (vectors.length < 3) return vectors.map((_, i) => [i, 0]);
  const umap = new UMAP({
    nComponents: 2,
    nNeighbors: Math.max(2, Math.min(opts.nNeighbors, vectors.length - 1)),
    minDist: opts.minDist,
    random: mulberry32(opts.seed),
  });
  return umap.fit(vectors).map((p) => [p[0]!, p[1]!] as [number, number]);
}
