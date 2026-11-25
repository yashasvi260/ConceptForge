import { motion } from "framer-motion";

export function heat(p: number): string {
  return `rgba(52, 211, 153, ${0.06 + Math.min(1, Math.max(0, p)) * 0.94})`;
}

export function signed(v: number): string {
  const a = Math.min(1, Math.abs(v));
  return v >= 0 ? `rgba(56,189,248,${0.12 + a * 0.85})` : `rgba(251,113,133,${0.12 + a * 0.85})`;
}

/** SVG arcs from the focused token to every token it attends to. */
export function AttentionArcs({ tokens, weights, focus, onFocus, causal }: { tokens: string[]; weights: number[]; focus: number; onFocus: (i: number) => void; causal: boolean }) {
  const gap = 78;
  const width = Math.max(tokens.length * gap, 320);
  const baseY = 150;
  const x = (i: number) => gap / 2 + i * gap;
  const maxW = Math.max(...weights, 1e-6);
  return (
    <svg viewBox={`0 0 ${width} 190`} className="h-auto w-full min-w-[460px]" role="img" aria-label={`Attention from "${tokens[focus] ?? ""}"`}>
      {tokens.map((_, j) => {
        const w = weights[j] ?? 0;
        if (j === focus || w < 0.005) return null;
        const h = Math.min(130, 30 + Math.abs(x(j) - x(focus)) * 0.45);
        return (
          <motion.path
            key={`${focus}-${j}`}
            d={`M ${x(focus)} ${baseY - 22} Q ${(x(focus) + x(j)) / 2} ${baseY - 22 - h} ${x(j)} ${baseY - 22}`}
            fill="none"
            stroke="#34d399"
            strokeLinecap="round"
            strokeWidth={1 + 9 * w}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.15 + 0.85 * (w / maxW) }}
            transition={{ duration: 0.4 }}
          />
        );
      })}
      {tokens.map((t, j) => {
        const masked = causal && j > focus;
        const isFocus = j === focus;
        return (
          <g key={j} transform={`translate(${x(j)}, ${baseY})`} className="cursor-pointer" onClick={() => onFocus(j)} onMouseEnter={() => onFocus(j)} role="button" aria-label={`Focus token ${t}`}>
            <rect x={-gap / 2 + 4} y={-20} width={gap - 8} height={30} rx={7} fill={isFocus ? "#10b981" : masked ? "#0f172a" : heat((weights[j] ?? 0) * 0.9)} stroke={isFocus ? "#6ee7b7" : "#1e293b"} strokeDasharray={masked ? "3 3" : undefined} />
            <text y={0} textAnchor="middle" fontSize={13} fill={isFocus ? "#022c22" : masked ? "#475569" : "#e2e8f0"} className="font-mono">
              {t.length > 8 ? `${t.slice(0, 7)}…` : t}
            </text>
            <text y={28} textAnchor="middle" fontSize={10} fill="#64748b" className="font-mono">
              {masked ? "masked" : isFocus ? "query" : `${((weights[j] ?? 0) * 100).toFixed(0)}%`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Heatmap({ tokens, matrix, focus, compact = false }: { tokens: string[]; matrix: number[][]; focus?: number; compact?: boolean }) {
  const cell = compact ? "h-3 w-3" : "h-7 w-7";
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0.5" aria-label="Attention heatmap">
        {!compact && (
          <thead>
            <tr>
              <th />
              {tokens.map((t, j) => (
                <th key={j} className="px-0.5 font-mono text-[10px] font-normal text-slate-400">
                  {t.slice(0, 5)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i} className={focus === i ? "outline outline-1 outline-emerald-400" : ""}>
              {!compact && <th className="pr-1.5 text-right font-mono text-[11px] font-normal text-slate-400">{tokens[i]}</th>}
              {row.map((p, j) => (
                <td
                  key={j}
                  data-testid={compact ? undefined : "heat-cell"}
                  data-upper={j > i}
                  data-p={p}
                  title={`${tokens[i]} → ${tokens[j]}: ${(p * 100).toFixed(1)}%`}
                  className={`${cell} rounded-sm`}
                  style={{ backgroundColor: p === 0 ? "#0b1220" : heat(p) }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Line chart of functions over [-4, 4]. */
export function Curves({ fns }: { fns: { name: string; color: string; f: (x: number) => number }[] }) {
  const W = 320;
  const H = 180;
  const sx = (x: number) => ((x + 4) / 8) * W;
  const sy = (y: number) => H - ((y + 1) / 5) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-md" role="img" aria-label="Activation functions">
      <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} stroke="#334155" />
      <line x1={sx(0)} x2={sx(0)} y1={0} y2={H} stroke="#334155" />
      {fns.map((fn) => (
        <polyline
          key={fn.name}
          fill="none"
          stroke={fn.color}
          strokeWidth={2}
          points={Array.from({ length: 81 }, (_, i) => {
            const x = -4 + i * 0.1;
            return `${sx(x)},${sy(Math.max(-1, Math.min(4, fn.f(x))))}`;
          }).join(" ")}
        />
      ))}
    </svg>
  );
}
