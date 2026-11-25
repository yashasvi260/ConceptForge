import { describe, expect, it } from "vitest";
import ref from "./data/hdbscan-reference.json";
import { hdbscan } from "./hdbscan";
import { mulberry32 } from "./random";

function blob(cx: number, cy: number, n: number, seed: number): number[][] {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => [cx + (r() - 0.5), cy + (r() - 0.5)]);
}

/**
 * Compare with scikit-learn up to renaming the clusters. Noise (−1) must match exactly; each of our clusters
 * maps to the sklearn cluster most of its points share, and we count points that end up elsewhere.
 */
function partitionDiff(ours: number[], sk: number[]): { noiseMismatch: number; moved: number; clusters: [number, number] } {
  const noiseMismatch = ours.filter((x, i) => (x === -1) !== (sk[i] === -1)).length;
  const votes = new Map<number, Map<number, number>>();
  ours.forEach((x, i) => {
    if (x === -1 || sk[i] === -1) return;
    const m = votes.get(x) ?? new Map<number, number>();
    m.set(sk[i]!, (m.get(sk[i]!) ?? 0) + 1);
    votes.set(x, m);
  });
  let moved = 0;
  for (const m of votes.values()) {
    const counts = [...m.values()];
    moved += counts.reduce((a, b) => a + b, 0) - Math.max(...counts);
  }
  const k = (ls: number[]) => new Set(ls.filter((l) => l !== -1)).size;
  return { noiseMismatch, moved, clusters: [k(ours), k(sk)] };
}

describe("HDBSCAN", () => {
  it("hdbscan finds two well-separated blobs and marks a far point as noise", () => {
    const pts = [...blob(0, 0, 20, 1), ...blob(10, 10, 20, 2), [50, -40]];
    const { labels } = hdbscan(pts, { minClusterSize: 5 });
    expect(new Set(labels.slice(0, 20)).size).toBe(1);
    expect(new Set(labels.slice(20, 40)).size).toBe(1);
    expect(labels[0]).not.toBe(labels[20]);
    expect(labels[40]).toBe(-1);
  });

  it("minClusterSize larger than the data → all noise", () => {
    const { labels, outlierScores } = hdbscan(blob(0, 0, 8, 3), { minClusterSize: 20 });
    expect(labels.every((l) => l === -1)).toBe(true);
    expect(outlierScores.every(Number.isFinite)).toBe(true);
  });

  it("identical points → all in one group (one cluster or all noise), no NaN", () => {
    const pts = Array.from({ length: 12 }, () => [1, 1]);
    const { labels, outlierScores } = hdbscan(pts, { minClusterSize: 5 });
    expect(new Set(labels).size).toBe(1);
    expect(outlierScores.every(Number.isFinite)).toBe(true);
  });

  it("outlier score highest for the far point", () => {
    const pts = [...blob(0, 0, 20, 4), ...blob(8, 8, 20, 5), [4, 30]];
    const { outlierScores } = hdbscan(pts, { minClusterSize: 5 });
    expect(outlierScores.indexOf(Math.max(...outlierScores))).toBe(40);
    for (const s of outlierScores) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  it.each(ref.cases.map((c) => [`min_cluster_size=${c.minClusterSize}, min_samples=${c.minSamples ?? "default"}`, c] as const))(
    "hdbscan matches scikit-learn on a fixed dataset (%s)",
    (_name, c) => {
      const { labels } = hdbscan(ref.points, { minClusterSize: c.minClusterSize, minSamples: c.minSamples ?? undefined });
      const d = partitionDiff(labels, c.labels);
      expect(d.noiseMismatch).toBe(0);
      expect(d.clusters[0]).toBe(d.clusters[1]);
      // The data has exactly tied core distances; sklearn orders tied MST edges with numpy's unstable sort,
      // so a point on a tied boundary may fall either way. Allow at most one such point.
      expect(d.moved).toBeLessThanOrEqual(1);
    },
  );
});
