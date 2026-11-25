import { useState } from "react";
import { Panel, Segmented } from "../../../components/ui";
import { ARCHITECTURES, outputKind, visibility, type Arch } from "../architectures";

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];
const LABELS: Record<Arch, string> = {
  bow: "Bag-of-Words",
  encoder: "Encoder · BERT",
  decoder: "Decoder · GPT",
  "encoder-decoder": "Enc-Dec · T5",
};

export function ArchView() {
  const [arch, setArch] = useState<Arch>("encoder");
  const [row, setRow] = useState(2);
  const grid = visibility(arch, TOKENS.length);
  return (
    <>
      <Panel title="Architecture">
        <Segmented<Arch> label="Model family" value={arch} options={ARCHITECTURES.map((a) => ({ value: a.id, label: LABELS[a.id] }))} onChange={setArch} />
        <p className="mt-3 text-sm text-slate-300">{outputKind(arch)}</p>
      </Panel>
      <Panel title={`Who can see whom (row = the token doing the looking)`}>
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th />
                {TOKENS.map((t, j) => (
                  <th key={j} className="px-1 font-mono font-normal text-slate-400">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((cells, i) => (
                <tr key={i} onClick={() => setRow(i)} className="cursor-pointer">
                  <th className={`pr-2 text-right font-mono font-normal ${i === row ? "text-white" : "text-slate-400"}`}>{TOKENS[i]}</th>
                  {cells.map((v, j) => (
                    <td
                      key={j}
                      data-testid="vis-cell"
                      data-visible={v}
                      title={v ? `${TOKENS[i]} can use ${TOKENS[j]}` : `${TOKENS[i]} cannot see ${TOKENS[j]}`}
                      className={`h-7 w-9 rounded ${v ? (i === row ? "bg-violet-400" : "bg-violet-500/40") : "bg-slate-800/60"}`}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-400">
          “{TOKENS[row]}” can use:{" "}
          <span className="font-mono text-slate-200">{TOKENS.filter((_, j) => grid[row]![j]).join(" · ")}</span>
          {arch === "encoder-decoder" && " (plus every token of the encoded input, via cross-attention)"}
        </p>
      </Panel>
    </>
  );
}
