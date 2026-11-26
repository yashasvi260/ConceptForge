/**
 * HDBSCAN (Campello, Moulavi & Sander 2013), following scikit-learn's implementation step by step so the
 * labels match it (checked in hdbscan.test.ts against sklearn 1.5.2):
 *   1. core distance = distance to the min_samples-th nearest neighbour (the point itself counts as the first)
 *   2. mutual reachability = max(core_a, core_b, d(a, b)); minimum spanning tree (Prim)
 *   3. single-linkage tree from the sorted MST edges
 *   4. condensed tree with min_cluster_size (λ = 1 / distance)
 *   5. excess-of-mass cluster selection (the root is never a cluster)
 *   6. GLOSH outlier scores (Campello et al. 2015): 1 − λ(point) / λ_max(its cluster)
 */
export interface HdbscanResult {
  /** Cluster index per point, −1 = noise. Clusters are numbered 0, 1, … */
  labels: number[];
  /** GLOSH outlier score per point, 0 (core) … 1 (extreme outlier). */
  outlierScores: number[];
}

interface Row {
  parent: number;
  child: number;
  lambda: number;
  size: number;
}

const dist = (a: number[], b: number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(s);
};

export function hdbscan(points: number[][], opts: { minClusterSize: number; minSamples?: number }): HdbscanResult {
  const n = points.length;
  if (n === 0) return { labels: [], outlierScores: [] };
  if (n === 1) return { labels: [-1], outlierScores: [0] };
  const mcs = Math.max(2, opts.minClusterSize);
  const k = Math.min(n, Math.max(1, opts.minSamples ?? mcs));

  // 1. distances and core distances
  const D = points.map((a) => points.map((b) => dist(a, b)));
  const core = D.map((row) => [...row].sort((x, y) => x - y)[k - 1]!);

  // 2. Prim's MST on mutual reachability
  const inTree = new Array<boolean>(n).fill(false);
  const best = new Array<number>(n).fill(Infinity);
  const from = new Array<number>(n).fill(-1);
  const edges: [number, number, number][] = [];
  let current = 0;
  inTree[0] = true;
  for (let step = 0; step < n - 1; step++) {
    for (let j = 0; j < n; j++) {
      if (inTree[j]) continue;
      const mr = Math.max(core[current]!, core[j]!, D[current]![j]!);
      if (mr < best[j]!) {
        best[j] = mr;
        from[j] = current;
      }
    }
    let next = -1;
    for (let j = 0; j < n; j++) if (!inTree[j] && (next < 0 || best[j]! < best[next]!)) next = j;
    edges.push([from[next]!, next, best[next]!]);
    inTree[next] = true;
    current = next;
  }
  edges.sort((a, b) => a[2] - b[2]); // stable, like numpy's mergesort

  // 3. single-linkage tree: node ids n … 2n−2
  const ufParent = Array.from({ length: 2 * n - 1 }, (_, i) => i);
  const ufSize: number[] = Array.from({ length: 2 * n - 1 }, (_, i) => (i < n ? 1 : 0));
  const find = (x: number) => {
    while (ufParent[x] !== x) {
      ufParent[x] = ufParent[ufParent[x]!]!;
      x = ufParent[x]!;
    }
    return x;
  };
  const hierarchy: { left: number; right: number; d: number; size: number }[] = [];
  edges.forEach(([a, b, d], i) => {
    const ra = find(a);
    const rb = find(b);
    const node = n + i;
    const size = ufSize[ra]! + ufSize[rb]!;
    hierarchy.push({ left: ra, right: rb, d, size });
    ufParent[ra] = node;
    ufParent[rb] = node;
    ufSize[node] = size;
  });
  const sizeOf = (node: number) => (node < n ? 1 : hierarchy[node - n]!.size);
  const bfs = (root: number) => {
    const out: number[] = [];
    let queue = [root];
    while (queue.length) {
      out.push(...queue);
      queue = queue.filter((x) => x >= n).flatMap((x) => [hierarchy[x - n]!.left, hierarchy[x - n]!.right]);
    }
    return out;
  };

  // 4. condensed tree: cluster ids start at n (the root)
  const root = 2 * n - 2;
  const relabel = new Map<number, number>([[root, n]]);
  let nextLabel = n + 1;
  const ignore = new Set<number>();
  const rows: Row[] = [];
  const dropAll = (sub: number, parent: number, lambda: number) => {
    for (const x of bfs(sub)) {
      if (x < n) rows.push({ parent, child: x, lambda, size: 1 });
      ignore.add(x);
    }
  };
  for (const node of bfs(root)) {
    if (ignore.has(node) || node < n) continue;
    const { left, right, d } = hierarchy[node - n]!;
    const lambda = d > 0 ? 1 / d : Infinity;
    const lc = sizeOf(left);
    const rc = sizeOf(right);
    const me = relabel.get(node)!;
    if (lc >= mcs && rc >= mcs) {
      relabel.set(left, nextLabel++);
      rows.push({ parent: me, child: relabel.get(left)!, lambda, size: lc });
      relabel.set(right, nextLabel++);
      rows.push({ parent: me, child: relabel.get(right)!, lambda, size: rc });
    } else if (lc < mcs && rc < mcs) {
      dropAll(left, me, lambda);
      dropAll(right, me, lambda);
    } else if (lc < mcs) {
      relabel.set(right, me);
      dropAll(left, me, lambda);
    } else {
      relabel.set(left, me);
      dropAll(right, me, lambda);
    }
  }

  // 5. stability and excess-of-mass selection
  const clusterIds = [...new Set(rows.map((r) => r.parent))].sort((a, b) => a - b);
  const birth = new Map<number, number>([[n, 0]]);
  for (const r of rows) if (r.child >= n) birth.set(r.child, r.lambda);
  const stability = new Map<number, number>(clusterIds.map((c) => [c, 0]));
  for (const r of rows) {
    const contrib = (r.lambda - (birth.get(r.parent) ?? 0)) * r.size;
    stability.set(r.parent, (stability.get(r.parent) ?? 0) + (Number.isNaN(contrib) ? 0 : contrib));
  }
  const childClusters = (c: number) => rows.filter((r) => r.parent === c && r.child >= n).map((r) => r.child);
  const isCluster = new Map<number, boolean>();
  const nodeList = [...clusterIds].sort((a, b) => b - a).filter((c) => c !== n);
  for (const c of nodeList) isCluster.set(c, true);
  for (const c of nodeList) {
    const kids = childClusters(c);
    const subtree = kids.reduce((s, k2) => s + (stability.get(k2) ?? 0), 0);
    if (subtree > stability.get(c)!) {
      isCluster.set(c, false);
      stability.set(c, subtree);
    } else {
      const stack = [...kids];
      while (stack.length) {
        const s = stack.pop()!;
        isCluster.set(s, false);
        stack.push(...childClusters(s));
      }
    }
  }
  const selected = [...isCluster.entries()].filter(([, v]) => v).map(([c]) => c).sort((a, b) => a - b);
  const labelOf = new Map(selected.map((c, i) => [c, i]));

  // 6. labels: walk up from each point to the first selected cluster (root → noise)
  const parentOf = new Map<number, number>();
  const lambdaOfPoint = new Array<number>(n).fill(0);
  for (const r of rows) {
    parentOf.set(r.child, r.parent);
    if (r.child < n) lambdaOfPoint[r.child] = r.lambda;
  }
  const labels = Array.from({ length: n }, (_, i) => {
    let node = parentOf.get(i);
    while (node !== undefined) {
      if (labelOf.has(node)) return labelOf.get(node)!;
      if (node === n) return -1;
      node = parentOf.get(node);
    }
    return -1;
  });

  // GLOSH: λ_max(C) = largest λ at which any point leaves C or one of its sub-clusters
  const maxLambda = new Map<number, number>();
  for (const c of [...clusterIds].sort((a, b) => b - a)) {
    let m = 0;
    for (const r of rows) {
      if (r.parent !== c) continue;
      m = Math.max(m, r.child < n ? r.lambda : (maxLambda.get(r.child) ?? 0));
    }
    maxLambda.set(c, m);
  }
  const outlierScores = Array.from({ length: n }, (_, i) => {
    const lMax = maxLambda.get(parentOf.get(i) ?? n) ?? 0;
    const l = lambdaOfPoint[i]!;
    if (lMax === 0 || lMax === l) return 0;
    if (!Number.isFinite(lMax)) return Number.isFinite(l) ? 1 : 0;
    const s = (lMax - l) / lMax;
    return Number.isFinite(s) ? Math.min(1, Math.max(0, s)) : 0;
  });

  return { labels, outlierScores };
}
