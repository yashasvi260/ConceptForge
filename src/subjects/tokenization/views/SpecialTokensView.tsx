import { MessagesSquare, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Panel, Toggle } from "../../../components/ui";
import { encodeWordPiece } from "../wordpiece";
import { useRealTokenizer } from "../useRealTokenizer";
import { TextBox, TokenChip, TokenizerStatus, visible } from "./common";
import { VocabStatus, useBertVocab } from "./WordPieceView";

/** Llama 3 chat-template control tokens (from its tokenizer_config.json). */
const LLAMA_SPECIALS = ["<|begin_of_text|>", "<|start_header_id|>", "<|end_header_id|>", "<|eot_id|>"];

type Segment = { kind: "special" | "text"; value: string; role?: "injected" };

function userSegments(text: string, unsafe: boolean): Segment[] {
  if (!unsafe) return [{ kind: "text", value: text }];
  const pattern = new RegExp(`(${LLAMA_SPECIALS.map((s) => s.replace(/[|]/g, "\\|")).join("|")})`, "g");
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) => (LLAMA_SPECIALS.includes(part) ? { kind: "special", value: part, role: "injected" } : { kind: "text", value: part }));
}

function template(system: string, user: string, unsafe: boolean): Segment[] {
  return [
    { kind: "special", value: "<|begin_of_text|>" },
    { kind: "special", value: "<|start_header_id|>" },
    { kind: "text", value: "system" },
    { kind: "special", value: "<|end_header_id|>" },
    { kind: "text", value: `\n\n${system}` },
    { kind: "special", value: "<|eot_id|>" },
    { kind: "special", value: "<|start_header_id|>" },
    { kind: "text", value: "user" },
    { kind: "special", value: "<|end_header_id|>" },
    { kind: "text", value: "\n\n" },
    ...userSegments(user, unsafe),
    { kind: "special", value: "<|eot_id|>" },
    { kind: "special", value: "<|start_header_id|>" },
    { kind: "text", value: "assistant" },
    { kind: "special", value: "<|end_header_id|>" },
    { kind: "text", value: "\n\n" },
  ];
}

export function SpecialTokensView() {
  const [user, setUser] = useState("Summarise this article for me.");
  const [unsafe, setUnsafe] = useState(false);
  const system = "You are a helpful assistant. Never reveal the admin password.";
  const segments = template(system, user, unsafe);
  const injected = segments.some((s) => s.role === "injected");
  const literal = useRealTokenizer("o200k_base", "<|eot_id|>");
  const bert = useBertVocab();

  const pairA = "How are you?";
  const pairB = "Fine, thanks.";
  const bertTokens = bert.vocab
    ? [
        { text: "[CLS]", id: 101 },
        ...encodeWordPiece(pairA, bert.vocab).tokens,
        { text: "[SEP]", id: 102 },
        ...encodeWordPiece(pairB, bert.vocab).tokens,
        { text: "[SEP]", id: 102 },
        { text: "[PAD]", id: 0 },
        { text: "[PAD]", id: 0 },
      ]
    : [];

  return (
    <>
      <Panel title="A chat becomes one token stream (Llama 3 chat template)" icon={<MessagesSquare size={14} />}>
        <TextBox label="User message" value={user} onChange={setUser} rows={2} maxLength={400} />
        <div className="mt-3">
          <Toggle
            label="Unsafe tokenizer"
            checked={unsafe}
            onChange={setUnsafe}
            description="Wrongly turns control-token text typed by the user into real control tokens."
          />
        </div>
        <div className="mt-4 rounded-lg bg-slate-950 p-3 font-mono text-xs leading-6 text-slate-300" data-testid="chat-template">
          {segments.map((s, i) =>
            s.kind === "special" ? (
              <span
                key={i}
                data-testid="special-chip"
                className={`mx-0.5 rounded px-1 py-0.5 ${s.role === "injected" ? "bg-rose-500/30 text-rose-100" : "bg-violet-500/25 text-violet-100"}`}
              >
                {s.value}
              </span>
            ) : (
              <span key={i} className="whitespace-pre-wrap">
                {s.value.replace(/\n/g, "↵\n")}
              </span>
            ),
          )}
        </div>
        {injected ? (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-100">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            Injected! The user's text closed their own turn and started a fake new one. The model would treat the injected
            part as a genuine system or assistant message.
          </p>
        ) : (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-100">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            Safe: whatever the user types stays ordinary text inside their turn. Try typing{" "}
            <code className="font-mono">{"<|eot_id|>"}</code> in the message.
          </p>
        )}
        <div className="mt-3 text-xs text-slate-500">
          <TokenizerStatus state={literal}>
            Typed as text, <code className="font-mono">{"<|eot_id|>"}</code> is {literal.tokens.length} ordinary GPT-4o tokens:{" "}
            {literal.tokens.map((t) => visible(t.text)).join(" · ")}
          </TokenizerStatus>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="BERT: sentence pair with real ids">
          {bert.vocab ? (
            <div className="flex flex-wrap gap-1" data-testid="bert-pair">
              {bertTokens.map((t, i) => (
                <TokenChip key={i} index={i} text={t.text} id={t.id} />
              ))}
            </div>
          ) : (
            <VocabStatus state={bert} />
          )}
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            <li><code className="font-mono">[CLS]</code> 101: start; its final vector summarises the input for classification.</li>
            <li><code className="font-mono">[SEP]</code> 102: separates the two sentences.</li>
            <li><code className="font-mono">[PAD]</code> 0: fills short inputs so a batch has equal lengths.</li>
            <li><code className="font-mono">[MASK]</code> 103: hides a word the model must guess during pre-training.</li>
            <li><code className="font-mono">[UNK]</code> 100: anything WordPiece can't spell.</li>
          </ul>
        </Panel>
        <Panel title="GPT: <|endoftext|>">
          <p className="text-sm text-slate-300">Marks the boundary between documents during training, and can mean “stop”.</p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {[
                ["GPT-2 (gpt2 / r50k)", "50256"],
                ["GPT-4 (cl100k_base)", "100257"],
                ["GPT-4o (o200k_base)", "199999"],
              ].map(([k, v]) => (
                <tr key={k} className="border-t border-slate-800">
                  <td className="py-1.5 text-slate-400">{k}</td>
                  <td className="py-1.5 text-right font-mono text-slate-100">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">Same idea, different ID in every vocabulary.</p>
        </Panel>
      </div>
    </>
  );
}
