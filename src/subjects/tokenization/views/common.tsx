import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import type { RealTokenizerState } from "../useRealTokenizer";

/** Background colours cycled across neighbouring tokens so boundaries are visible. */
const TOKEN_COLORS = [
  "bg-sky-500/25 border-sky-400/40",
  "bg-amber-500/25 border-amber-400/40",
  "bg-emerald-500/25 border-emerald-400/40",
  "bg-rose-500/25 border-rose-400/40",
  "bg-violet-500/25 border-violet-400/40",
];

/** Make spaces, newlines and tabs visible inside token chips. */
export function visible(text: string): string {
  return text.replace(/ /g, "␣").replace(/\n/g, "↵").replace(/\t/g, "⇥");
}

export function TokenChip({ text, id, index, flag }: { text: string; id?: number; index: number; flag?: string }) {
  return (
    <span
      data-testid="token-chip"
      title={flag ?? (id !== undefined ? `id ${id}` : undefined)}
      className={`inline-flex flex-col items-center rounded-md border px-1.5 py-0.5 font-mono text-sm leading-tight text-slate-100 ${
        flag ? "border-rose-500/70 bg-rose-500/15 line-through decoration-rose-400/70" : TOKEN_COLORS[index % TOKEN_COLORS.length]
      }`}
    >
      <span className="whitespace-pre">{visible(text)}</span>
      {id !== undefined && <span className="text-[10px] text-slate-400">{id}</span>}
    </span>
  );
}

export function TokenRow({ tokens, showIds = false, testId }: { tokens: { text: string; id?: number }[]; showIds?: boolean; testId?: string }) {
  return (
    <div className="flex flex-wrap gap-1" data-testid={testId}>
      {tokens.map((t, i) => (
        <TokenChip key={i} index={i} text={t.text} id={showIds ? t.id : undefined} />
      ))}
    </div>
  );
}

export function TextBox({
  label,
  value,
  onChange,
  rows = 2,
  placeholder,
  maxLength = 20000,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      {rows === 1 ? (
        <input
          aria-label={label}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
        />
      ) : (
        <textarea
          aria-label={label}
          value={value}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
        />
      )}
    </label>
  );
}

/** Loading / error states for anything that depends on a real tokenizer. */
export function TokenizerStatus({ state, children }: { state: RealTokenizerState; children: React.ReactNode }) {
  if (state.status === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-400" role="status">
        <Loader2 size={15} className="animate-spin" /> Loading the tokenizer vocabulary…
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100" role="alert">
        <AlertTriangle size={16} />
        Couldn't load the tokenizer vocabulary (are you offline on first visit?). If Retry keeps failing, reload the page.
        <button type="button" onClick={state.retry} className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-1 hover:bg-rose-500/30">
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

export const formatInt = (n: number) => n.toLocaleString("en-US");
