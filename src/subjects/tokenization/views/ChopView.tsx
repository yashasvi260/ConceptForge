import { Blocks } from "lucide-react";
import type { ReactNode } from "react";
import { Panel } from "../../../components/ui";
import { splitChars, splitWords } from "../chop";
import { useRealTokenizer } from "../useRealTokenizer";
import { TextBox, TokenChip, TokenizerStatus } from "./common";

/** A deliberately small word-level dictionary, to show what happens to words outside it. */
const DICTIONARY = new Set(
  `the a an and or but if of to in on at by for with from as is are was were be been it its this that these those
   i you he she we they me him her us them my your his our their what which who when where why how all any some no not
   can could will would should may might must do does did done have has had make made get got go went come came see saw
   know think take give use find tell ask work call try need feel become leave put mean keep let begin seem help show
   hear play run move like live believe hold bring happen write sit stand lose pay meet include continue set learn change
   lead understand watch follow stop create speak read spend grow open walk win offer remember love consider appear buy
   wait serve die send expect build stay fall cut reach kill remain handle handled good new first last long great little
   own other old right big high different small large next early young important few public bad same able time person year
   way day thing man world life hand part child eye woman place week case point company number group problem fact word
   text model models language emoji computer data weather today walk beautiful`.split(/\s+/),
);

function Row({ title, count, hint, children }: { title: string; count: number; hint: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        <span className="font-mono text-xs text-slate-400">
          {count} pieces · <span className="text-slate-500">{hint}</span>
        </span>
      </header>
      <div className="flex flex-wrap gap-1">{children}</div>
    </section>
  );
}

export function ChopView({ text, setText }: { text: string; setText: (t: string) => void }) {
  const chars = splitChars(text).filter((c) => c !== " ");
  const words = splitWords(text);
  const tk = useRealTokenizer("o200k_base", text);
  const isWord = (w: string) => /\p{L}/u.test(w);
  const unknown = words.filter((w) => isWord(w) && !DICTIONARY.has(w.toLowerCase())).length;

  return (
    <>
      <Panel title="Your text">
        <TextBox label="Sample text" value={text} onChange={setText} />
      </Panel>
      <Panel title="Same text, three ways (LEGO studs → custom pieces → standard bricks)" icon={<Blocks size={14} />}>
        <div className="space-y-3">
          <Row title="Characters" count={chars.length} hint="tiny vocabulary, very long sequences (spaces hidden)">
            {chars.slice(0, 300).map((c, i) => (
              <TokenChip key={i} index={i} text={c} />
            ))}
          </Row>
          <Row title="Words" count={words.length} hint={`${unknown} unknown to a ${DICTIONARY.size}-word dictionary`}>
            {words.map((w, i) => (
              <TokenChip
                key={i}
                index={i}
                text={isWord(w) && !DICTIONARY.has(w.toLowerCase()) ? "[UNK]" : w}
                flag={isWord(w) && !DICTIONARY.has(w.toLowerCase()) ? `"${w}" is not in the dictionary, so it becomes [UNK]` : undefined}
              />
            ))}
          </Row>
          <Row title="Subwords (GPT-4o)" count={tk.tokens.length} hint="fixed vocabulary that can still spell anything">
            <TokenizerStatus state={tk}>
              {tk.tokens.map((t, i) => (
                <TokenChip key={i} index={i} text={t.text} />
              ))}
            </TokenizerStatus>
          </Row>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          The word row uses a deliberately small, made-up dictionary to show the unknown-word problem. Real word-level
          vocabularies are bigger, but new names, typos and slang always fall outside them.
        </p>
      </Panel>
    </>
  );
}
