import { CheckCircle2, Lightbulb, Play, RotateCcw, Eye } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Exercise, ExercisePart } from "../../core/types";
import type { RunStatus } from "../../py/client";
import type { RunResult } from "../../py/program";
import { usePyRunner } from "../../py/PyRunnerContext";
import { RichText } from "../ui";

export const CODE_KEY = "conceptforge:code:v1";

const draftKey = (exerciseId: string, partId: string) => `${CODE_KEY}:${exerciseId}/${partId}`;

function readDraft(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeDraft(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the draft just won't survive a reload.
  }
}

const STATUS_TEXT: Record<RunStatus, string> = {
  loading: "Loading Python (≈10 MB, first time only)",
  running: "Running…",
};

interface PartProps {
  exercise: Exercise;
  part: ExercisePart;
  index: number;
  prelude: string;
  data: unknown;
  passed: boolean;
  onPassed: () => void;
}

function ExercisePartView({ exercise, part, index, prelude, data, passed, onPassed }: PartProps) {
  const run = usePyRunner();
  const key = draftKey(exercise.id, part.id);
  const [code, setCode] = useState(() => readDraft(key) ?? part.starter);
  const [status, setStatus] = useState<RunStatus | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  /** After Esc, the next Tab leaves the code box instead of indenting (keyboard users can't be trapped). */
  const tabLeaves = useRef(false);
  const caretRef = useRef<number | null>(null);
  const mounted = useRef(true);
  const reqId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (caretRef.current !== null && boxRef.current) {
      boxRef.current.selectionStart = boxRef.current.selectionEnd = caretRef.current;
      caretRef.current = null;
    }
  }, [code]);

  const update = (next: string) => {
    setCode(next);
    writeDraft(key, next === part.starter ? null : next);
  };

  const onRun = async () => {
    const id = ++reqId.current;
    setResult(null);
    setStatus("running");
    const r = await run({ learnerCode: code, prelude, checks: part.checks, data, packages: exercise.packages }, (s) => {
      if (mounted.current && reqId.current === id) setStatus(s);
    });
    if (!mounted.current || reqId.current !== id) return;
    setStatus(null);
    setResult(r);
    if (r.status === "pass") onPassed();
  };

  /** Replacing the code (Reset, Show solution) makes the last result meaningless. */
  const replace = (next: string) => {
    reqId.current++;
    setStatus(null);
    setResult(null);
    update(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      tabLeaves.current = true;
      return;
    }
    if (e.key !== "Tab" || e.shiftKey || tabLeaves.current) {
      tabLeaves.current = false;
      return;
    }
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: end } = el;
    caretRef.current = s + 4;
    update(code.slice(0, s) + "    " + code.slice(end));
  };

  const busy = status !== null;
  const n = index + 1;
  const btn =
    "inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section role="group" aria-label={`Part ${n}`} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-slate-200">
          <span className="mr-2 font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">Part {n}</span>
          <RichText text={part.prompt} />
        </p>
        {passed && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
            <CheckCircle2 size={12} aria-hidden="true" />
            Passed
          </span>
        )}
      </div>
      {prelude && <p className="mt-1 text-xs text-slate-500">Earlier parts run with the reference solution.</p>}
      <textarea
        ref={boxRef}
        aria-label={`Code for part ${n}`}
        aria-describedby={`${key}-keys`}
        value={code}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(e) => update(e.target.value)}
        onKeyDown={onKeyDown}
        rows={Math.min(24, Math.max(6, code.split("\n").length + 1))}
        onBlur={() => (tabLeaves.current = false)}
        className="mt-3 w-full resize-y rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[13px] leading-relaxed text-slate-100 focus:border-cyan-500 focus:outline-none"
      />
      <p id={`${key}-keys`} className="mt-1 text-[11px] text-slate-500">
        Tab indents. To leave the code box with the keyboard, press Esc, then Tab.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onRun} disabled={busy} className={`${btn} border-cyan-600 bg-cyan-500/10 text-cyan-200`}>
          <Play size={12} aria-hidden="true" />
          Run
        </button>
        <button type="button" onClick={() => replace(part.starter)} className={btn}>
          <RotateCcw size={12} aria-hidden="true" />
          Reset
        </button>
        <button type="button" onClick={() => setHintsShown((h) => h + 1)} disabled={hintsShown >= part.hints.length} className={btn}>
          <Lightbulb size={12} aria-hidden="true" />
          Hint
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Show the solution? Try a hint first.")) replace(part.solution);
          }}
          className={btn}
        >
          <Eye size={12} aria-hidden="true" />
          Show solution
        </button>
        {status && (
          <span role="status" className="text-xs text-slate-400">
            {STATUS_TEXT[status]}
          </span>
        )}
      </div>
      {hintsShown > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-amber-200">
          {part.hints.slice(0, hintsShown).map((h, i) => (
            <li key={i} className="flex gap-2">
              <Lightbulb size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <RichText text={h} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <div aria-live="polite">{result && <ResultView result={result} onRetry={onRun} />}</div>
    </section>
  );
}

function ResultView({ result, onRetry }: { result: RunResult; onRetry: () => void }) {
  return (
    <div className="mt-3 space-y-2">
      {result.error && (
        <div role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-200">
          <span>{result.error}</span>
          {result.status === "load-error" && (
            <button type="button" onClick={onRetry} className="rounded border border-rose-400/60 px-2 py-0.5 font-sans text-rose-100">
              Retry
            </button>
          )}
        </div>
      )}
      {result.checks.length > 0 && (
        <ul className="space-y-1 text-sm">
          {result.checks.map((c) => (
            <li key={c.name} className={c.ok ? "text-emerald-300" : "text-rose-300"}>
              <span>
                {c.ok ? "✓" : "✗"} {c.name}
              </span>
              {c.message && <span className="ml-2 text-xs text-slate-400">{c.message}</span>}
            </li>
          ))}
        </ul>
      )}
      {result.status === "pass" && <p className="text-sm font-medium text-emerald-300">All checks pass.</p>}
      {result.stdout && (
        <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300">{result.stdout}</pre>
      )}
    </div>
  );
}

export function CodeExercise({
  exercise,
  data,
  passedParts,
  onPartPassed,
}: {
  exercise: Exercise;
  data: unknown;
  passedParts: string[];
  onPartPassed: (partId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-white">{exercise.title}</h4>
      {exercise.parts.map((p, i) => (
        <ExercisePartView
          key={p.id}
          exercise={exercise}
          part={p}
          index={i}
          prelude={exercise.parts
            .slice(0, i)
            .map((q) => q.solution)
            .join("\n\n")}
          data={data}
          passed={passedParts.includes(p.id)}
          onPassed={() => onPartPassed(p.id)}
        />
      ))}
    </div>
  );
}
