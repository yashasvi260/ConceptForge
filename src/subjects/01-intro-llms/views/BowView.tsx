import { ShoppingBag } from "lucide-react";
import { Panel } from "../../../components/ui";
import { TextBox } from "../../02-tokens-embeddings/views/common";
import { bagOfWords, bowCosine } from "../bow";

export const MAX_SENTENCES = 6;

export function parseSentences(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, MAX_SENTENCES);
}

export function SentencesInput({ text, setText }: { text: string; setText: (t: string) => void }) {
  const lines = text.split("\n").map((s) => s.trim()).filter(Boolean).length;
  return (
    <Panel title="Sentences (one per line)">
      <TextBox label="Sentences" value={text} onChange={setText} rows={5} maxLength={1200} />
      {lines > MAX_SENTENCES && <p className="mt-1 text-xs text-amber-200">Using the first {MAX_SENTENCES} sentences.</p>}
    </Panel>
  );
}

export function BowView({ text, setText }: { text: string; setText: (t: string) => void }) {
  const sentences = parseSentences(text);
  const { vocab, counts } = bagOfWords(sentences);
  return (
    <>
      <SentencesInput text={text} setText={setText} />
      <Panel title="Each sentence as word counts" icon={<ShoppingBag size={14} />}>
        <div className="overflow-x-auto">
          <table aria-label="Word counts" className="text-xs">
            <thead>
              <tr>
                <th />
                {vocab.map((w) => (
                  <th key={w} className="px-1.5 py-1 font-mono font-normal text-slate-400">
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sentences.map((s, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <th className="max-w-[12rem] truncate py-1 pr-3 text-left font-normal text-slate-300" title={s}>
                    {s}
                  </th>
                  {counts[i]!.map((c, j) => (
                    <td key={j} className={`px-1.5 text-center font-mono ${c ? "text-sky-200" : "text-slate-700"}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Bag-of-Words similarity (cosine of the count rows)">
        <ul className="space-y-1 text-sm">
          {sentences.flatMap((a, i) =>
            sentences.slice(i + 1).map((b, k) => (
              <li key={`${i}-${k}`} className="flex justify-between gap-4 border-b border-slate-800 pb-1">
                <span className="text-slate-400">
                  {a} ↔ {b}
                </span>
                <span className="font-mono text-slate-100">{bowCosine(counts[i]!, counts[i + k + 1]!).toFixed(2)}</span>
              </li>
            )),
          )}
        </ul>
      </Panel>
    </>
  );
}
