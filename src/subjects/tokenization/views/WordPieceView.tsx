import { SearchCode } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel } from "../../../components/ui";
import { encodeWordPiece, loadBertVocab, type WordPieceVocab } from "../wordpiece";
import { TextBox, TokenChip } from "./common";

export function useBertVocab(): { vocab: WordPieceVocab | null; error: boolean; retry: () => void } {
  const [vocab, setVocab] = useState<WordPieceVocab | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setError(false);
    loadBertVocab().then(
      (v) => alive && setVocab(v),
      () => alive && setError(true),
    );
    return () => {
      alive = false;
    };
  }, [attempt]);
  return { vocab, error, retry: () => setAttempt((n) => n + 1) };
}

export function VocabStatus({ state }: { state: ReturnType<typeof useBertVocab> }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-rose-200">
        Couldn't load BERT's vocabulary (reload the page if Retry keeps failing).{" "}
        <button type="button" onClick={state.retry} className="underline">
          Retry
        </button>
      </p>
    );
  }
  return (
    <p role="status" className="text-sm text-slate-400">
      Loading BERT's 30,522-entry vocabulary…
    </p>
  );
}

export function WordPieceView() {
  const [text, setText] = useState("Huggingface tokenizers are unaffable!");
  const bert = useBertVocab();
  const result = bert.vocab ? encodeWordPiece(text, bert.vocab) : null;

  return (
    <>
      <Panel title="Real bert-base-uncased WordPiece">
        <TextBox label="Text for BERT" value={text} onChange={setText} rows={1} maxLength={300} />
        <div className="mt-4">
          {!result ? (
            <VocabStatus state={bert} />
          ) : (
            <div className="flex flex-wrap gap-1" data-testid="wordpiece-tokens">
              {result.tokens.map((t, i) => (
                <TokenChip key={i} index={i} text={t.text} id={t.id} flag={t.text === "[UNK]" ? "Some part of this word isn't in the vocabulary, so the whole word became [UNK]" : undefined} />
              ))}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Lower-cased and accents stripped first (that's what “uncased” means). <code className="font-mono">##</code> = continues the
          previous piece of the same word.
        </p>
      </Panel>
      {result && (
        <Panel title="Longest match first: what BERT checked, word by word" icon={<SearchCode size={14} />}>
          <ul className="space-y-3">
            {result.steps.slice(0, 12).map((s, i) => (
              <li key={i}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-mono text-slate-200">{s.word}</span>
                  <span className="text-slate-600">→</span>
                  {s.matched ? (
                    s.matched.map((p, j) => <TokenChip key={j} index={j} text={p} />)
                  ) : (
                    <TokenChip index={0} text="[UNK]" flag="no piece matched" />
                  )}
                </div>
                <p className="mt-1 break-words font-mono text-[11px] text-slate-500" data-testid={`wordpiece-attempts-${i}`}>
                  tried: {s.tried.slice(0, 14).join(" · ")}
                  {s.tried.length > 14 ? ` · … (${s.tried.length} checks)` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
