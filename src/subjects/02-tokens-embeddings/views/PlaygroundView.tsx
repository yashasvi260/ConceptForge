import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Panel, Stat } from "../../../components/ui";
import { DISPLAY_CHAR_LIMIT, ENCODINGS, type EncodingName } from "../realTokenizers";
import { useRealTokenizer } from "../useRealTokenizer";
import { TextBox, TokenChip, TokenizerStatus, formatInt } from "./common";

const DEFAULT_TEXT = `Tokenizers don't see words. They see chunks like "token", "izer" and " see"!
const total = prices.reduce((a, b) => a + b, 0);
Café, 東京, नमस्ते, 🤖 and https://example.com/path?q=1`;

function Column({ name, text, showIds }: { name: EncodingName; text: string; showIds: boolean }) {
  const tk = useRealTokenizer(name, text);
  const chars = Array.from(text).length;
  return (
    <section aria-label={ENCODINGS[name].label} className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-semibold text-slate-100">
          {ENCODINGS[name].label} <span className="font-mono text-xs text-slate-500">{name} · {ENCODINGS[name].approxVocab}</span>
        </h4>
        <span className="font-mono text-sm text-sky-200" data-testid="token-count">
          {tk.status === "ready" ? `${formatInt(tk.tokens.length)} tokens` : "…"}
        </span>
      </header>
      <TokenizerStatus state={tk}>
        <div className="flex max-h-96 flex-wrap gap-1 overflow-y-auto">
          {tk.tokens.slice(0, 1500).map((t, i) => (
            <TokenChip key={i} index={i} text={t.text} id={showIds ? t.id : undefined} />
          ))}
        </div>
        {tk.truncated && (
          <p className="mt-2 text-xs text-amber-200">Showing the first {formatInt(DISPLAY_CHAR_LIMIT)} characters only.</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Tokens" value={formatInt(tk.tokens.length)} />
          <Stat label="Chars / token" value={tk.tokens.length ? (Math.min(chars, DISPLAY_CHAR_LIMIT) / tk.tokens.length).toFixed(2) : "–"} />
        </div>
      </TokenizerStatus>
    </section>
  );
}

export function PlaygroundView() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [showIds, setShowIds] = useState(false);
  return (
    <>
      <Panel
        title="Paste anything"
        actions={
          <button
            type="button"
            onClick={() => setShowIds((v) => !v)}
            aria-pressed={showIds}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            {showIds ? <EyeOff size={13} /> : <Eye size={13} />} {showIds ? "Hide IDs" : "Show IDs"}
          </button>
        }
      >
        <TextBox label="Your text" value={text} onChange={setText} rows={5} maxLength={50_000} />
        <p className="mt-2 text-xs text-slate-500">
          Runs locally in your browser with OpenAI's open-source vocabularies. Nothing is sent anywhere. ␣ = space, ↵ = newline.
        </p>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2">
        <Column name="o200k_base" text={text} showIds={showIds} />
        <Column name="cl100k_base" text={text} showIds={showIds} />
      </div>
    </>
  );
}
