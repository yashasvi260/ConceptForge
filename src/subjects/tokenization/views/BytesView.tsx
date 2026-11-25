import { Binary } from "lucide-react";
import { useState } from "react";
import { Panel, Stat } from "../../../components/ui";
import { byteTable, hex } from "../bytes";
import { TextBox, formatInt } from "./common";

export function BytesView() {
  const [text, setText] = useState("a é 你 न 🤖");
  const rows = byteTable(text).filter((r) => r.char !== " ").slice(0, 60);
  const total = byteTable(text).reduce((n, r) => n + r.bytes.length, 0);
  return (
    <>
      <Panel title="Every character is stored as 1–4 bytes (UTF-8)" icon={<Binary size={14} />}>
        <TextBox label="Characters to inspect" value={text} onChange={setText} rows={1} maxLength={200} />
        <ul className="mt-4 space-y-1.5">
          {rows.map((r, i) => (
            <li key={i} data-testid={`bytes-${r.char}`} className="flex items-center gap-3">
              <span className="w-10 text-center text-2xl">{r.char}</span>
              <span className="flex flex-wrap gap-1">
                {r.bytes.map((b, j) => (
                  <span key={j} data-testid="byte" className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-amber-200">
                    {hex(b)}
                  </span>
                ))}
              </span>
              <span className="font-mono text-xs text-slate-500">
                {r.bytes.length} byte{r.bytes.length > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Characters" value={formatInt(Array.from(text).length)} />
          <div data-testid="byte-total">
            <Stat label="Bytes (incl. spaces)" value={formatInt(total)} />
          </div>
          <Stat label="Possible byte values" value="256" sub="= byte-level BPE's starting vocabulary" />
        </div>
      </Panel>
      <Panel title="Byte-level BPE (GPT-2 and later)">
        <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-950/60 p-3">
            <div className="font-mono text-lg text-sky-200">256</div>
            byte tokens: the starting alphabet. Any text at all can be written with them.
          </div>
          <div className="rounded-lg bg-slate-950/60 p-3">
            <div className="font-mono text-lg text-sky-200">+ 50,000</div>
            merges learned from data, so common byte sequences become single tokens.
          </div>
          <div className="rounded-lg bg-slate-950/60 p-3">
            <div className="font-mono text-lg text-sky-200">+ 1 = 50,257</div>
            with the special end-of-text token: GPT-2's vocabulary.
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          In GPT-2-style vocabulary files the space byte is printed as <code className="font-mono text-sky-200">Ġ</code>, so the
          token for <code className="font-mono">" the"</code> appears as <code className="font-mono text-sky-200">Ġthe</code>. It's
          the same token; only the printout differs.
        </p>
      </Panel>
    </>
  );
}
