import { ArrowDown, Calculator } from "lucide-react";
import { Panel, Stat } from "../../../components/ui";
import { DISPLAY_CHAR_LIMIT } from "../realTokenizers";
import { useRealTokenizer } from "../useRealTokenizer";
import { TextBox, TokenChip, TokenizerStatus } from "./common";

export function IntroView({ text, setText }: { text: string; setText: (t: string) => void }) {
  const tk = useRealTokenizer("o200k_base", text);
  const shownChars = Math.min(Array.from(text).length, DISPLAY_CHAR_LIMIT);
  return (
    <>
      <Panel title="Your text">
        <TextBox label="Sample text" value={text} onChange={setText} />
      </Panel>
      <Panel title="What the model actually receives (GPT-4o tokenizer)" icon={<Calculator size={14} />}>
        <TokenizerStatus state={tk}>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-xs text-slate-500">1 · Cut into tokens (spaces shown as ␣)</div>
              <div className="flex flex-wrap gap-1" data-testid="intro-tokens">
                {tk.tokens.map((t, i) => (
                  <TokenChip key={i} index={i} text={t.text} id={t.id} />
                ))}
                {tk.tokens.length === 0 && <span className="text-sm text-slate-500">Type something above.</span>}
              </div>
              {tk.truncated && (
                <p className="mt-1 text-xs text-amber-200">Showing the first 4,000 characters only.</p>
              )}
            </div>
            <ArrowDown size={16} className="mx-auto text-slate-600" />
            <div>
              <div className="mb-1 text-xs text-slate-500">2 · Only the numbers go into the model</div>
              <p className="break-words rounded-lg bg-slate-950 p-3 font-mono text-sm text-sky-200">
                [{tk.tokens.map((t) => t.id).join(", ")}]
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Characters shown" value={String(shownChars)} />
              <Stat label="Tokens" value={String(tk.tokens.length)} />
              <Stat
                label="Chars per token"
                value={tk.tokens.length ? (shownChars / tk.tokens.length).toFixed(1) : "–"}
              />
            </div>
          </div>
        </TokenizerStatus>
      </Panel>
    </>
  );
}
