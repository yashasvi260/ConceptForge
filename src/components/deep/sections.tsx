import { AlertTriangle, Check, Copy, ExternalLink } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ChallengeItem, ConceptPart, LocalListing, SourceLink, WorkedBlock } from "../../core/types";
import { RichText } from "../ui";

export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-3 text-[15px] leading-7 text-slate-300">
      {paragraphs.map((p, i) => (
        <p key={i}>
          <RichText text={p} />
        </p>
      ))}
    </div>
  );
}

export function WorkedExample({ blocks }: { blocks: WorkedBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.kind === "text") return <Prose key={i} paragraphs={[b.text]} />;
        if (b.kind === "math")
          return (
            <pre key={i} className="overflow-x-auto rounded-lg bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-sky-200">
              {b.text}
            </pre>
          );
        return (
          <div key={i} className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full border-collapse text-left font-mono text-xs">
              <caption className="bg-slate-900 px-3 py-2 text-left font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
                {b.caption}
              </caption>
              <thead>
                <tr>
                  {b.columns.map((c) => (
                    <th key={c} scope="col" className="border-b border-slate-800 bg-slate-900/60 px-3 py-1.5 font-semibold text-slate-300">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri} className="odd:bg-slate-950/40">
                    {r.map((cell, ci) => (
                      <td key={ci} className="border-b border-slate-800/60 px-3 py-1.5 text-slate-200">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export function ConceptPartView({ part }: { part: ConceptPart }) {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white">{part.heading}</h4>
      <Prose paragraphs={part.paragraphs} />
      {part.formula && (
        <div role="figure" aria-label={`Formula: ${part.formula.expr}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <pre className="overflow-x-auto font-mono text-base text-sky-200">{part.formula.expr}</pre>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="sr-only">
              <tr>
                <th scope="col">Symbol</th>
                <th scope="col">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {part.formula.symbols.map((s) => (
                <tr key={s.sym}>
                  <td className="w-24 py-1 pr-3 align-top font-mono text-sky-300">{s.sym}</td>
                  <td className="py-1 text-slate-300">{s.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-slate-400">
            <span className="font-semibold text-slate-300">Example: </span>
            <RichText text={part.formula.example} />
          </p>
        </div>
      )}
      {part.mistake && (
        <div role="note" aria-label="Common mistake" className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
          <span>
            <span className="font-semibold">Common mistake: </span>
            <RichText text={part.mistake} />
          </span>
        </div>
      )}
    </div>
  );
}

export function LocalListingView({ listing }: { listing: LocalListing }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(listing.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2">
        <span className="text-sm font-semibold text-slate-200">Run it locally · {listing.title}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy code: ${listing.title}`}
          className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:border-slate-500"
        >
          {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto border-b border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-200">{listing.install}</pre>
      <pre className="overflow-x-auto bg-slate-950 px-3 py-3 font-mono text-xs leading-5 text-slate-100">{listing.code}</pre>
      <p className="border-t border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Output (captured from a real run)
      </p>
      <pre className="max-h-72 overflow-auto bg-slate-950 px-3 py-3 font-mono text-xs leading-5 text-slate-300">{listing.output}</pre>
    </div>
  );
}

function InlineQuestion({ item }: { item: ChallengeItem }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState<number | null>(null);
  const right = checked !== null && checked === item.correctIndex;
  return (
    <div role="group" aria-label={item.prompt} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-sm font-medium text-slate-100">
        <RichText text={item.prompt} />
      </p>
      <div role="radiogroup" aria-label="Options" className="mt-3 space-y-1.5">
        {item.options.map((o, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={choice === i}
            aria-label={o.replace(/`/g, "")}
            onClick={() => setChoice(i)}
            className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
              choice === i ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-slate-800 text-slate-300 hover:border-slate-600"
            }`}
          >
            <RichText text={o} />
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={choice === null}
        onClick={() => setChecked(choice)}
        className="mt-3 rounded-md border border-cyan-600 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200 disabled:opacity-40"
      >
        Check
      </button>
      {checked !== null && (
        <div role="status" className={`mt-3 text-sm ${right ? "text-emerald-300" : "text-amber-300"}`}>
          <span className="font-semibold">{right ? "Correct. " : "Not quite. Try another option. "}</span>
          {right && (
            <span className="text-slate-300">
              <RichText text={item.explanation} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function InlineChecks({ items }: { items: ChallengeItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((q) => (
        <InlineQuestion key={q.id} item={q} />
      ))}
    </div>
  );
}

export function GoDeeper({ links }: { links: SourceLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Go deeper</p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {links.map((l) => (
          <li key={l.url} className="text-slate-400">
            <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-cyan-300 hover:underline">
              {l.label}
              <ExternalLink size={12} aria-hidden="true" />
            </a>{" "}
            · <RichText text={l.adds} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`deep-sec-${n}`} className="border-t border-slate-800 pt-8">
      <h3 id={`deep-sec-${n}`} className="mb-5 font-mono text-sm font-semibold uppercase tracking-[0.15em] text-cyan-300">
        {n} · {title}
      </h3>
      {children}
    </section>
  );
}
