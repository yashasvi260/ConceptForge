import type { Doc } from "../usePipeline";

/** 2-D map of documents. `color(i)` decides each point's fill; `size(i)` its radius. */
export function Scatter({
  xy,
  docs,
  color,
  size = () => 4,
  highlight,
}: {
  xy: [number, number][];
  docs: Doc[];
  color: (i: number) => string;
  size?: (i: number) => number;
  highlight?: number;
}) {
  const W = 420;
  const H = 280;
  const pad = 12;
  const xs = xy.map((p) => p[0]);
  const ys = xy.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sx = (x: number) => pad + ((x - x0) / (x1 - x0 || 1)) * (W - 2 * pad);
  const sy = (y: number) => pad + ((y - y0) / (y1 - y0 || 1)) * (H - 2 * pad);
  return (
    <svg role="img" aria-label="Document map" viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-lg border border-slate-800 bg-slate-950/40">
      {xy.map(([x, y], i) => (
        <circle
          key={docs[i]?.id ?? i}
          data-testid="doc-point"
          cx={sx(x)}
          cy={sy(y)}
          r={size(i)}
          style={{ fill: color(i), stroke: i === highlight ? "var(--color-white)" : "none", strokeWidth: 2, opacity: 0.9 }}
        >
          <title>{docs[i]?.text}</title>
        </circle>
      ))}
    </svg>
  );
}
