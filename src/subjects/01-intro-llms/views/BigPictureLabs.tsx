/** Concept labs for Module 01, step 1 ("What a language model does"). */
import { Dices, Eye, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Slider } from "../../../components/ui";
import { choicesAt } from "../generationLab";
import { nodeAt, pct, ProbBars, RecordedNote, showToken, useGenRecording, type GenRecording } from "./labkit";

type Load = { load?: () => Promise<GenRecording> };

function Loading({ title, failed }: { title: string; failed: boolean }) {
  return (
    <Panel title={title}>
      <p role="status" className="text-sm text-slate-400">
        {failed ? "Couldn't load the recorded gemma4 data." : "Loading real gemma4 probabilities…"}
      </p>
    </Panel>
  );
}

const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:opacity-40";

/* ------------------------------------------------------------------ guess the next token */

/** Lab: guess gemma4's next token from its real top five (shown in a fixed shuffled order), then reveal. */
export function GuessNextLab({ load }: Load) {
  const { rec, failed } = useGenRecording(load);
  const [prompt, setPrompt] = useState(0);
  const [guess, setGuess] = useState<string | null>(null);
  const [score, setScore] = useState<{ tries: number; top: number }>({ tries: 0, top: 0 });
  if (!rec) return <Loading title="Guess the next token" failed={failed} />;
  const tree = rec.trees[prompt]!;
  const top = choicesAt(tree, 0, 1).slice(0, 5);
  // A fixed shuffle (reverse alphabetical by token) so the most likely answer isn't always first.
  const options = [...top].sort((a, b) => b.token.localeCompare(a.token));
  const pick = (t: string) => {
    if (guess) return;
    setGuess(t);
    setScore((s) => ({ tries: s.tries + 1, top: s.top + (t === top[0]!.token ? 1 : 0) }));
  };
  const chosen = top.find((c) => c.token === guess);
  return (
    <Panel title="Guess the next token">
      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Prompt
        <select
          value={prompt}
          onChange={(e) => {
            setPrompt(Number(e.target.value));
            setGuess(null);
          }}
          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        >
          {rec.trees.map((t, i) => (
            <option key={t.prompt} value={i}>
              “{t.prompt}”
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 text-sm text-slate-300">
        “{tree.prompt} <span className="rounded bg-violet-500/15 px-1.5 text-violet-200">___</span>” — which token does gemma4 think comes next?
      </p>
      <div role="group" aria-label="Your guess" className="mt-2 flex flex-wrap gap-2">
        {options.map((c) => (
          <button
            key={c.token}
            type="button"
            onClick={() => pick(c.token)}
            disabled={!!guess}
            aria-pressed={guess === c.token}
            className={`rounded-lg border px-3 py-1.5 font-mono text-sm transition ${
              guess === c.token ? "border-violet-500 bg-violet-500/15 text-violet-100" : "border-slate-700 text-slate-200 hover:border-slate-500"
            }`}
          >
            {showToken(c.token)}
          </button>
        ))}
      </div>
      {guess && chosen && (
        <div className="mt-4 space-y-2">
          <p role="status" className="text-sm text-slate-200">
            {guess === top[0]!.token ? "Spot on: that's gemma4's top choice. " : `gemma4 gave your guess ${pct(chosen.raw)}. Its top choice was ${showToken(top[0]!.token)}. `}
            Not one answer, though: a probability for every token.
          </p>
          <ProbBars label="gemma4's real probabilities" items={top.map((c) => ({ label: showToken(c.token), value: c.raw, highlight: c.token === guess }))} />
          <button type="button" className={btn} onClick={() => setGuess(null)}>
            <RotateCcw size={14} aria-hidden="true" /> Guess again
          </button>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Your score: {score.top} of {score.tries} guesses matched gemma4's top choice.
      </p>
      <RecordedNote rec={rec} />
    </Panel>
  );
}

/* ------------------------------------------------------------------ temperature */

const TEMP_POINTS: { label: string; path: string[] }[] = [
  { label: "…there was a small ___", path: ["small"] },
  { label: "…a small village ___", path: ["small", " village"] },
  { label: "…a small village nestled ___", path: ["small", " village", " nestled"] },
];

/** Lab: reshape a real gemma4 distribution with temperature, and sample from it to see the spread. */
export function TemperatureLab({ load, rand = Math.random }: Load & { rand?: () => number }) {
  const { rec, failed } = useGenRecording(load);
  const [point, setPoint] = useState(0);
  const [temperature, setTemperature] = useState(1);
  const [tally, setTally] = useState<Record<string, number> | null>(null);
  if (!rec) return <Loading title="Temperature" failed={failed} />;
  const tree = rec.trees[0]!;
  const node = nodeAt(tree, TEMP_POINTS[point]!.path);
  const choices = node === null ? [] : choicesAt(tree, node, temperature).slice(0, 6);
  const sample20 = () => {
    const all = node === null ? [] : choicesAt(tree, node, temperature);
    const t: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      let r = rand();
      const hit = all.find((c) => (r -= c.adjusted) < 0) ?? all[all.length - 1]!;
      t[hit.token] = (t[hit.token] ?? 0) + 1;
    }
    setTally(t);
  };
  return (
    <Panel title="Temperature: how adventurous is the choice?">
      <div role="group" aria-label="Point in the story" className="flex flex-wrap gap-1.5">
        {TEMP_POINTS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={i === point}
            onClick={() => {
              setPoint(i);
              setTally(null);
            }}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${i === point ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-400"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Slider
          label="Temperature"
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          onChange={(v) => {
            setTemperature(v);
            setTally(null);
          }}
          format={(v) => (v === 0 ? "0 (greedy)" : v.toFixed(1))}
          hint="Below 1 sharpens the list, above 1 flattens it, 0 always takes the top token."
        />
      </div>
      <div className="mt-3">
        <ProbBars
          label="Probabilities after temperature"
          items={choices.map((c) => ({ label: showToken(c.token), value: c.adjusted, note: `gemma4's raw probability: ${pct(c.raw)}` }))}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={sample20}>
          <Dices size={14} aria-hidden="true" /> Sample 20 times
        </button>
        {tally && (
          <span role="status" className="text-sm text-slate-300">
            {Object.entries(tally)
              .sort((a, b) => b[1] - a[1])
              .map(([t, n]) => `${showToken(t)} ×${n}`)
              .join(" · ")}
          </span>
        )}
      </div>
      <RecordedNote rec={rec} />
    </Panel>
  );
}

/* ------------------------------------------------------------------ bigram counter */

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z']+|[.,!?]/g) ?? [];
}

export function bigramCounts(tokens: string[]): Map<string, Map<string, number>> {
  const counts = new Map<string, Map<string, number>>();
  for (let i = 0; i + 1 < tokens.length; i++) {
    const row = counts.get(tokens[i]!) ?? new Map<string, number>();
    row.set(tokens[i + 1]!, (row.get(tokens[i + 1]!) ?? 0) + 1);
    counts.set(tokens[i]!, row);
  }
  return counts;
}

/** Greedy generation: always the most frequent follower (ties: the one seen first). Stops early on a dead end. */
export function greedyBigram(counts: Map<string, Map<string, number>>, start: string, n: number): string[] {
  const out = [start];
  for (let i = 0; i < n; i++) {
    const row = counts.get(out[out.length - 1]!);
    if (!row) break;
    let best: string | null = null;
    for (const [t, c] of row) if (best === null || c > row.get(best)!) best = t;
    out.push(best!);
  }
  return out;
}

export const BIGRAM_TEXT = "the cat sat on the mat . the cat ate the fish . the dog sat on the rug .";

/** Lab: a counting language model you can edit, to see what counting can and can't do. */
export function BigramLab() {
  const [text, setText] = useState(BIGRAM_TEXT);
  const tokens = useMemo(() => tokenize(text), [text]);
  const counts = useMemo(() => bigramCounts(tokens), [tokens]);
  const words = useMemo(() => [...counts.keys()], [counts]);
  const [word, setWord] = useState("the");
  const [check, setCheck] = useState("dog");
  const current = counts.has(word) ? word : (words[0] ?? "");
  const row = counts.get(current) ?? new Map<string, number>();
  const total = [...row.values()].reduce((a, b) => a + b, 0);
  const pCheck = total ? (row.get(check.trim().toLowerCase()) ?? 0) / total : 0;
  const greedy = current ? greedyBigram(counts, current, 8) : [];
  return (
    <Panel title="A counting language model (bigram)">
      <label className="block text-xs text-slate-400">
        Training text (edit it)
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-sm text-slate-100"
        />
      </label>
      <p className="mt-1 text-[11px] text-slate-500">{tokens.length} tokens · {words.length} words that have a follower</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          After the word
          <select value={current} onChange={(e) => setWord(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-sm text-slate-100">
            {words.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3">
        <ProbBars
          label={`What follows ${current}`}
          items={[...row.entries()].map(([t, c]) => ({ label: t, value: c / total, note: `seen ${c} of ${total} times` }))}
        />
      </div>
      <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
        Probability of
        <input value={check} onChange={(e) => setCheck(e.target.value)} aria-label="Word to check" className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-0.5 font-mono text-sm text-slate-100" />
        after <span className="font-mono">{current}</span>:
        <span role="status" className={`font-mono ${pCheck === 0 ? "text-rose-300" : "text-emerald-300"}`}>
          {pct(pCheck)}
          {pCheck === 0 ? " — never seen, so impossible forever" : ""}
        </span>
      </label>
      <p className="mt-3 text-sm text-slate-300">
        Greedy from <span className="font-mono">{current}</span>: <span className="font-mono text-emerald-300">{greedy.join(" ")}</span>
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ what it takes to guess */

const NEEDS: Record<string, string> = {
  "Once upon a time, there was a": "story sense: what fairy tales sound like",
  "My favourite thing about weekends is": "everyday common sense: what people enjoy",
  "The bank approved the": "world knowledge: what banks approve",
  "The capital of France is": "a fact: memorised from training text",
};

/** Lab: four prompts that each need a different kind of knowledge, with gemma4's real answers. */
export function NextTokenTasksLab({ load }: Load) {
  const { rec, failed } = useGenRecording(load);
  const [open, setOpen] = useState<string[]>([]);
  if (!rec) return <Loading title="What it takes to guess well" failed={failed} />;
  return (
    <Panel title="What it takes to guess well">
      <p className="text-sm text-slate-400">Each prompt needs a different kind of knowledge to continue. Predict gemma4's answer, then reveal it.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {rec.trees.map((t) => {
          const shown = open.includes(t.prompt);
          const top = choicesAt(t, 0, 1).slice(0, 3);
          return (
            <li key={t.prompt} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <p className="text-sm font-medium text-slate-100">“{t.prompt} ___”</p>
              <p className="mt-1 text-xs text-slate-400">Needs {NEEDS[t.prompt] ?? "knowledge"}</p>
              {shown ? (
                <div className="mt-2">
                  <ProbBars label={`gemma4's answer to ${t.prompt}`} items={top.map((c) => ({ label: showToken(c.token), value: c.raw }))} />
                </div>
              ) : (
                <button type="button" className={`${btn} mt-2`} onClick={() => setOpen((o) => [...o, t.prompt])} aria-label={`Reveal gemma4's answer to ${t.prompt}`}>
                  <Eye size={14} aria-hidden="true" /> Reveal
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <RecordedNote rec={rec} />
    </Panel>
  );
}
