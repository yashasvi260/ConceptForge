import { Globe } from "lucide-react";
import { useState } from "react";
import { Panel } from "../../../components/ui";
import { useRealTokenizer } from "../useRealTokenizer";
import { TextBox, TokenizerStatus } from "./common";

/** Example sentences; their real counts are recorded in docs/research/tokenization-sources.md. */
export const LANGUAGE_SAMPLES: { label: string; text: string }[] = [
  { label: "English", text: "The weather is beautiful today, let's go for a walk." },
  { label: "Spanish", text: "Hoy hace un tiempo precioso, vamos a dar un paseo." },
  { label: "Hindi", text: "आज मौसम बहुत सुंदर है, चलो टहलने चलते हैं।" },
  { label: "Japanese", text: "今日はとても良い天気なので、散歩に行きましょう。" },
  { label: "Code", text: "for (let i = 0; i < 10; i++) { console.log(i); }" },
  { label: "Numbers", text: "1234567 + 3.14159 = 1234570.14159" },
];

export function LanguagesView() {
  const [own, setOwn] = useState("Ton texte ici : essaie une phrase en français.");
  const o200 = useRealTokenizer("o200k_base", "");
  const cl100 = useRealTokenizer("cl100k_base", "");
  const ready = o200.encoder && cl100.encoder;
  const rows = [...LANGUAGE_SAMPLES, { label: "Your sentence", text: own }];
  const english = o200.encoder?.encode(LANGUAGE_SAMPLES[0]!.text).length ?? 1;

  return (
    <>
      <Panel title="Same meaning, different price" icon={<Globe size={14} />}>
        <TokenizerStatus state={o200.status === "ready" ? cl100 : o200}>
          {ready && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2 pr-3 font-normal">Language</th>
                    <th className="py-2 pr-3 font-normal">Text</th>
                    <th className="py-2 pr-3 text-right font-normal">GPT-4o</th>
                    <th className="py-2 pr-3 text-right font-normal">GPT-4</th>
                    <th className="py-2 text-right font-normal">vs English (GPT-4o)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const a = o200.encoder!.encode(r.text).length;
                    const b = cl100.encoder!.encode(r.text).length;
                    return (
                      <tr key={r.label} className="border-t border-slate-800">
                        <td className="py-2 pr-3 text-slate-200">{r.label}</td>
                        <td className="max-w-[18rem] truncate py-2 pr-3 font-mono text-xs text-slate-400" title={r.text}>
                          {r.text}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono text-sky-200">{a}</td>
                        <td className={`py-2 pr-3 text-right font-mono ${b > a * 1.5 ? "text-rose-300" : "text-slate-300"}`}>{b}</td>
                        <td className="py-2 text-right font-mono text-slate-400">{(a / english).toFixed(1)}× English</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TokenizerStatus>
        <div className="mt-4">
          <TextBox label="Your sentence" value={own} onChange={setOwn} rows={1} maxLength={400} />
        </div>
      </Panel>
    </>
  );
}
