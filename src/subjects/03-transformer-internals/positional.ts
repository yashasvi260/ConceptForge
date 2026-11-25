/** Sinusoidal positional encoding (Vaswani et al. 2017, §3.5). */
export function sinusoidal(pos: number, dim: number): number[] {
  return Array.from({ length: dim }, (_, d) => {
    const angle = pos / Math.pow(10000, (2 * Math.floor(d / 2)) / dim);
    return d % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
  });
}

/** Rotation angle RoPE applies to dimension pair i at position `pos` (θᵢ = 10000^(−2i/d)). */
export function ropeAngle(pos: number, pair: number, dim: number): number {
  return pos * Math.pow(10000, (-2 * pair) / dim);
}

/**
 * Rotary position embedding (Su et al. 2021): rotate each pair (2i, 2i+1) of a query/key vector by an
 * angle proportional to its position. Rotations preserve length, and the dot product of two rotated
 * vectors depends only on the difference of their positions.
 */
export function rope(vec: number[], pos: number): number[] {
  const out = [...vec];
  for (let i = 0; i + 1 < vec.length; i += 2) {
    const a = ropeAngle(pos, i / 2, vec.length);
    const c = Math.cos(a);
    const s = Math.sin(a);
    out[i] = vec[i]! * c - vec[i + 1]! * s;
    out[i + 1] = vec[i]! * s + vec[i + 1]! * c;
  }
  return out;
}
