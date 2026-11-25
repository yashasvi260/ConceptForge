import { Bug, Hash, Repeat, Space, Type } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Panel } from "../../../components/ui";
import { tokenizeForDisplay, type RealEncoder } from "../realTokenizers";
import { useRealTokenizer } from "../useRealTokenizer";
import { TextBox, TokenChip, TokenizerStatus } from "./common";

function Split({ enc, text, label }: { enc: RealEncoder; text: string; label?: string }) {
  const { tokens } = tokenizeForDisplay(enc, text);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="w-28 shrink-0 font-mono text-xs text-slate-400">{label ?? JSON.stringify(text)}</span>
      {tokens.map((t, i) => (
        <TokenChip key={i} index={i} text={t.text} />
      ))}
      <span className="font-mono text-[11px] text-slate-500">
        {tokens.length} token{tokens.length === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <article aria-label={title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
        {icon} {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </article>
  );
}

export function QuirksView() {
  const [own, setOwn] = useState("mississippi");
  const tk = useRealTokenizer("o200k_base", "");
  const enc = tk.encoder;
  return (
    <TokenizerStatus state={tk}>
      {enc && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Counting letters in strawberry" icon={<Type size={15} />}>
            <Split enc={enc} text="How many r's are in strawberry?" label="the question" />
            <div data-testid="strawberry-plain">
              <Split enc={enc} text="strawberry" />
            </div>
            <p className="text-xs text-slate-400">
              In the question, “ strawberry” is a single token; on its own the word is three chunks. Either way the model never
              sees ten letters, so it has to remember how each token is spelled.
            </p>
          </Card>
          <Card title="Spaces and capitals change everything" icon={<Space size={15} />}>
            <Split enc={enc} text=" strawberry" />
            <Split enc={enc} text="STRAWBERRY" />
            <Split enc={enc} text=" hello" />
            <Split enc={enc} text="hello" />
            <p className="text-xs text-slate-400">Different text, different token IDs. To the model these are unrelated symbols at first.</p>
          </Card>
          <Card title="Numbers come in 3-digit chunks" icon={<Hash size={15} />}>
            <Split enc={enc} text="1234567" />
            <Split enc={enc} text="3.14159" />
            <Split enc={enc} text="2026" />
            <p className="text-xs text-slate-400">Digit-level arithmetic is harder when “1234567” arrives as 123 · 456 · 7.</p>
          </Card>
          <Card title="Glitch tokens: SolidGoldMagikarp" icon={<Bug size={15} />}>
            <p className="text-xs text-slate-300">
              In GPT-2's vocabulary, <code className="font-mono">" SolidGoldMagikarp"</code> was a <strong>single token</strong> (id
              43453): a Reddit username frequent in the tokenizer's data but rare in the model's training text. The model barely
              learned by the GPT-3-era models that shared this vocabulary, which produced bizarre output when asked about it
              (Rumbelow &amp; Watkins, 2023).
            </p>
            <Split enc={enc} text=" SolidGoldMagikarp" label="GPT-4o today" />
          </Card>
          <Card title="Reversing words" icon={<Repeat size={15} />}>
            <Split enc={enc} text="stressed" />
            <Split enc={enc} text="desserts" label='reversed' />
            <p className="text-xs text-slate-400">
              Reversing means reordering letters, but the model only sees whole tokens. The reversed word is a completely different
              set of tokens, so the model has to reason about spelling it never directly sees.
            </p>
          </Card>
          <div className="lg:col-span-2">
            <Panel title="Try your own tricky word">
              <TextBox label="Tricky word" value={own} onChange={setOwn} rows={1} maxLength={80} />
              <div className="mt-3">
                <Split enc={enc} text={own} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {Array.from(own).length} characters vs {tokenizeForDisplay(enc, own).tokens.length} tokens.
              </p>
            </Panel>
          </div>
        </div>
      )}
    </TokenizerStatus>
  );
}
