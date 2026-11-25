export const relu = (x: number): number => Math.max(0, x);

/** GELU, tanh approximation of x·Φ(x) (Hendrycks & Gimpel). */
export function gelu(x: number): number {
  return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
}

/** SiLU = Swish₁(x) = x·σ(x). */
export function silu(x: number): number {
  return x / (1 + Math.exp(-x));
}

/** SwiGLU (Shazeer 2020): Swish₁(xW) ⊙ xV, element-wise; inputs are the two projections. */
export function swiglu(gate: number[], up: number[]): number[] {
  return gate.map((g, i) => silu(g) * up[i]!);
}
