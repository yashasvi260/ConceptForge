/** Cosine similarity; 0 when either vector is all zeros. */
export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

/** Element-wise average of equally sized vectors. */
export function meanPool(vectors: ArrayLike<number>[]): Float32Array {
  if (vectors.length === 0) return new Float32Array(0);
  const out = new Float32Array(vectors[0]!.length);
  for (const v of vectors) for (let i = 0; i < out.length; i++) out[i]! += v[i]! / vectors.length;
  return out;
}
