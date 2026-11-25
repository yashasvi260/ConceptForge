/** Pure logic behind the visual. Keep it free of React so it is easy to unit test. */
export function scaled(intensity: number): number {
  return Math.max(0, Math.min(1, intensity / 100));
}
