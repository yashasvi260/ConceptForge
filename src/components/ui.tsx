import type { ReactNode } from "react";

/** Renders text with `inline code` and **bold** spans. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.length > 1 && part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-200">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-slate-200">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function Panel({
  title,
  icon,
  children,
  className = "",
  actions,
}: {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-slate-800 bg-slate-900/60 p-4 ${className}`}>
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && (
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {icon}
              {title}
            </h3>
          )}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-slate-100">{format(value)}</span>
      </span>
      <input
        type="range"
        aria-label={label}
        className="mt-1.5 w-full cursor-pointer"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left transition hover:border-slate-700"
    >
      <span
        className={`mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
          checked ? "bg-sky-500" : "bg-slate-700"
        }`}
      >
        <span className={`h-4 w-4 rounded-full bg-white shadow transition ${checked ? "translate-x-4" : ""}`} />
      </span>
      <span>
        <span className="block text-sm text-slate-200">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm text-slate-300">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-lg bg-slate-900 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              value === o.value ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "bad";
  sub?: string;
}) {
  const toneClass = {
    neutral: "text-slate-100",
    good: "text-emerald-300",
    warn: "text-amber-300",
    bad: "text-rose-300",
  }[tone];
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`font-mono text-lg ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

/** Horizontal bar with label and value, used by several stages. */
export function Bar({
  label,
  value,
  max = 1,
  color = "var(--color-sky-400)",
  display,
  dim = false,
}: {
  label: ReactNode;
  value: number;
  max?: number;
  color?: string;
  display?: string;
  dim?: boolean;
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`flex items-center gap-2 text-xs ${dim ? "opacity-35" : ""}`}>
      <span className="w-24 shrink-0 truncate font-mono text-slate-300">{label}</span>
      <span className="relative h-3 flex-1 overflow-hidden rounded bg-slate-800">
        <span
          className="absolute inset-y-0 left-0 rounded transition-[width] duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </span>
      <span className="w-14 shrink-0 text-right font-mono text-slate-400">{display ?? value.toFixed(2)}</span>
    </div>
  );
}
