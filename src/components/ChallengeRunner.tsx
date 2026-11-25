import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { useState } from "react";
import { ACCENTS } from "../core/accent";
import type { SubjectProgress } from "../core/storage";
import type { SubjectModule } from "../core/types";
import { RichText } from "./ui";

interface ChallengeRunnerProps {
  subject: SubjectModule;
  progress: SubjectProgress;
  onFinish: (correct: number, total: number) => void;
  onReviewStep: (stepId: string) => void;
  /** Random source for shuffling answer order; inject a fixed one in tests. */
  random?: () => number;
}

/** Fisher–Yates shuffle of `0..n-1`, so the right answer isn't always in the same slot. */
export function shuffledOrder(n: number, random: () => number = Math.random): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

type Phase = "answering" | "checked" | "done";

export function ChallengeRunner({ subject, progress, onFinish, onReviewStep, random = Math.random }: ChallengeRunnerProps) {
  const a = ACCENTS[subject.accent];
  const items = subject.challenges;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [correctCount, setCorrectCount] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [hintShown, setHintShown] = useState(false);
  const newOrders = () => items.map((c) => shuffledOrder(c.options.length, random));
  const [orders, setOrders] = useState<number[][]>(newOrders);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-400">
        This subject has no challenges yet.
      </div>
    );
  }

  const item = items[Math.min(index, items.length - 1)]!;
  const isCorrect = selected === item.correctIndex;

  const check = () => {
    if (selected === null) return;
    setPhase("checked");
    if (selected === item.correctIndex) setCorrectCount((c) => c + 1);
    else setMissed((m) => [...m, item.id]);
  };

  const next = () => {
    if (index + 1 >= items.length) {
      setPhase("done");
      onFinish(correctCount, items.length);
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setHintShown(false);
    setPhase("answering");
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setHintShown(false);
    setPhase("answering");
    setCorrectCount(0);
    setMissed([]);
    setOrders(newOrders());
  };

  if (phase === "done") {
    const pct = Math.round((correctCount / items.length) * 100);
    const missedItems = items.filter((c) => missed.includes(c.id));
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center"
        >
          <Trophy className={`mx-auto ${a.text}`} size={40} />
          <h2 className="mt-3 text-2xl font-semibold">Challenge complete</h2>
          <p className="mt-2 text-slate-300" data-testid="challenge-score">
            You scored {correctCount} / {items.length} ({pct}%)
          </p>
          {progress.bestScore && (
            <p className="mt-1 text-sm text-slate-500">
              Best: {progress.bestScore.correct} / {progress.bestScore.total} · Attempts: {progress.attempts}
            </p>
          )}
          {missedItems.length > 0 && (
            <div className="mt-6 text-left">
              <h3 className="text-sm font-semibold text-slate-300">Worth reviewing</h3>
              <ul className="mt-2 space-y-2">
                {missedItems.map((c) => {
                  const step = subject.steps.find((s) => s.id === c.relatedStepId);
                  return (
                    <li key={c.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-950/60 p-3 text-sm">
                      <span className="text-slate-400">
                        <RichText text={c.prompt} />
                      </span>
                      {step && (
                        <button
                          type="button"
                          onClick={() => onReviewStep(step.id)}
                          className={`shrink-0 text-xs font-medium ${a.text} hover:underline`}
                        >
                          Review “{step.title}”
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={restart}
            className={`mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${a.solid}`}
          >
            <RotateCcw size={15} /> Try again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          {subject.title} · Question {index + 1} of {items.length}
        </span>
        <span className="font-mono">Score {correctCount}</span>
      </div>
      <div className="mb-6 h-1 overflow-hidden rounded bg-slate-800">
        <div className={`h-full ${a.bg} transition-all`} style={{ width: `${(index / items.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <h2 className="text-lg font-medium leading-snug text-white">
            <RichText text={item.prompt} />
          </h2>
          <div role="radiogroup" aria-label="Answer options" className="mt-5 space-y-2">
            {(orders[index] ?? item.options.map((_, i) => i)).map((i, slot) => {
              const opt = item.options[i]!;
              const chosen = selected === i;
              const showRight = phase === "checked" && i === item.correctIndex;
              const showWrong = phase === "checked" && chosen && !isCorrect;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  disabled={phase === "checked"}
                  onClick={() => setSelected(i)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                    showRight
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100"
                      : showWrong
                        ? "border-rose-500/60 bg-rose-500/10 text-rose-100"
                        : chosen
                          ? `${a.border} ${a.softBg} text-white`
                          : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-700 font-mono text-xs">
                    {String.fromCharCode(65 + slot)}
                  </span>
                  <span className="flex-1">
                    <RichText text={opt} />
                  </span>
                  {showRight && <CheckCircle2 size={18} className="text-emerald-400" />}
                  {showWrong && <XCircle size={18} className="text-rose-400" />}
                </button>
              );
            })}
          </div>

          {phase === "checked" && (
            <div
              role="status"
              className={`mt-5 rounded-lg p-4 text-sm ${
                isCorrect ? "bg-emerald-500/10 text-emerald-100" : "bg-rose-500/10 text-rose-100"
              }`}
            >
              <p className="font-semibold">{isCorrect ? "Correct!" : "Not quite."}</p>
              <p className="mt-1 text-slate-300">
                <RichText text={item.explanation} />
              </p>
            </div>
          )}

          {item.hint && phase === "answering" && (
            <div className="mt-4 text-sm">
              {hintShown ? (
                <p className="rounded-lg bg-slate-950/60 p-3 text-slate-300">
                  <span className="font-semibold text-slate-200">Hint: </span>
                  <RichText text={item.hint} />
                </p>
              ) : (
                <button type="button" onClick={() => setHintShown(true)} className={`${a.text} hover:underline`}>
                  Show hint
                </button>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {phase === "answering" ? (
              <button
                type="button"
                onClick={check}
                disabled={selected === null}
                className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 ${a.solid}`}
              >
                Check answer
              </button>
            ) : (
              <button type="button" onClick={next} className={`rounded-lg px-4 py-2 text-sm font-medium ${a.solid}`}>
                {index + 1 >= items.length ? "See results" : "Next question"}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
