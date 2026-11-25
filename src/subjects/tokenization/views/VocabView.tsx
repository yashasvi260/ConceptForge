import { BookOpen } from "lucide-react";
import { useState } from "react";
import { Panel, Segmented, Stat } from "../../../components/ui";
import { utf8Bytes } from "../bytes";
import { useRealTokenizer } from "../useRealTokenizer";
import { TextBox, TokenizerStatus, formatInt } from "./common";

type Choice = "bytes" | "cl100k_base" | "o200k_base";

const CHOICES: { value: Choice; label: string; vocab: number; approx: boolean }[] = [
  { value: "bytes", label: "Bytes (256)", vocab: 256, approx: false },
  { value: "cl100k_base", label: "GPT-4 (≈100k)", vocab: 100_000, approx: true },
  { value: "o200k_base", label: "GPT-4o (≈200k)", vocab: 200_000, approx: true },
];

const WIDTHS = [
  { value: "768", label: "768" },
  { value: "4096", label: "4,096" },
  { value: "8192", label: "8,192" },
];

/** Vocabulary sizes from model configs / docs (see docs/research/tokenization-sources.md). */
const REAL_SIZES: [string, string][] = [
  ["BERT (bert-base-uncased)", "30,522"],
  ["GPT-2", "50,257"],
  ["GPT-4 (cl100k_base)", "≈100k"],
  ["Llama 3", "128,256"],
  ["GPT-4o (o200k_base)", "≈200k"],
];

function bytesLabel(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024).toFixed(1)} KB`;
}

export function VocabView({ text, setText }: { text: string; setText: (t: string) => void }) {
  const [choice, setChoice] = useState<Choice>("o200k_base");
  const [width, setWidth] = useState("4096");
  const tk = useRealTokenizer(choice === "bytes" ? "o200k_base" : choice, text);
  const meta = CHOICES.find((c) => c.value === choice)!;
  // Count the whole text (the display cap only applies to token chips elsewhere).
  const tokens = choice === "bytes" ? utf8Bytes(text).length : tk.encoder ? tk.encoder.encode(text).length : null;
  const tableBytes = meta.vocab * Number(width) * 2; // fp16: 2 bytes per number

  return (
    <>
      <Panel title="Your text">
        <TextBox label="Sample text" value={text} onChange={setText} />
      </Panel>
      <Panel title="Vocabulary size trade-off" icon={<BookOpen size={14} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Segmented<Choice> label="Tokenizer" value={choice} options={CHOICES.map(({ value, label }) => ({ value, label }))} onChange={setChoice} />
          <Segmented label="Model width (numbers per token, example)" value={width} options={WIDTHS} onChange={setWidth} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div data-testid="vocab-token-count">
            {choice === "bytes" || tk.status !== "error" ? (
              <Stat label="Tokens for this text" value={tokens === null ? "…" : formatInt(tokens)} tone="good" />
            ) : (
              <TokenizerStatus state={tk}>{null}</TokenizerStatus>
            )}
          </div>
          <Stat label="Vocabulary entries" value={`${meta.approx ? "≈" : ""}${formatInt(meta.vocab)}`} />
          <div data-testid="vocab-table-size">
            <Stat label="Embedding table (fp16)" value={`${meta.approx ? "≈" : ""}${bytesLabel(tableBytes)}`} tone="warn" sub="entries × width × 2 bytes" />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Fewer tokens per text (cheaper, more fits in context) on one side; a bigger table and rarer entries on the other.
        </p>
      </Panel>
      <Panel title="Real vocabulary sizes">
        <table className="w-full text-sm">
          <tbody>
            {REAL_SIZES.map(([name, size]) => (
              <tr key={name} className="border-t border-slate-800">
                <td className="py-1.5 text-slate-300">{name}</td>
                <td className="py-1.5 text-right font-mono text-slate-100">{size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
