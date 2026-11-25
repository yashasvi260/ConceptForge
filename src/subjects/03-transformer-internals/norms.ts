/** LayerNorm: subtract the mean, divide by the standard deviation (gain 1, bias 0). */
export function layerNorm(x: number[], eps = 1e-5): number[] {
  const mean = x.reduce((a, b) => a + b, 0) / x.length;
  const variance = x.reduce((a, b) => a + (b - mean) ** 2, 0) / x.length;
  return x.map((v) => (v - mean) / Math.sqrt(variance + eps));
}

/** RMSNorm (Zhang & Sennrich 2019): divide by the root mean square; no mean subtraction (gain 1). */
export function rmsNorm(x: number[], eps = 1e-6): number[] {
  const rms = Math.sqrt(x.reduce((a, b) => a + b * b, 0) / x.length + eps);
  return x.map((v) => v / rms);
}
