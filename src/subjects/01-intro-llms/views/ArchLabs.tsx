/** Concept labs for Module 01, step 8 ("The three architectures"). */
import { Dices } from "lucide-react";
import { useState } from "react";
import { Panel, Segmented } from "../../../components/ui";
import { MODEL_CONFIGS, fmt, paramBreakdown, short } from "../modelConfigs";
import { ProbBars } from "./labkit";

const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500";
type Family = "encoder" | "decoder" | "encoder-decoder";
const FAMILY_LABEL: Record<Family, string> = { encoder: "Encoder (BERT, MiniLM)", decoder: "Decoder (GPT, Llama, Gemma)", "encoder-decoder": "Encoder-decoder (T5, BART)" };

/* ------------------------------------------------------------------ which family for which job */

const TASKS: { task: string; family: Family; why: string }[] = [
  { task: "Search a million documents by meaning", family: "encoder", why: "One vector per document, computed once; a small encoder is fast and cheap to run over everything." },
  { task: "Sort support tickets into 5 categories", family: "encoder", why: "A vector plus a small classifier is fast, cheap and easy to evaluate." },
  { task: "Chat with users and answer questions", family: "decoder", why: "Open-ended text out: a decoder writes one token at a time, conditioned on the whole conversation." },
  { task: "Write code from a description", family: "decoder", why: "Free-form generation; any task phrased as text in, text out suits a decoder." },
  { task: "Translate English to French", family: "encoder-decoder", why: "A separate input to read fully, and an output to write: the original Transformer's job (decoders do it well too)." },
  { task: "Summarise a long report", family: "encoder-decoder", why: "Read everything with two-sided context, then write a shorter text; large decoders now also do this well." },
];

/** Lab: pick a task, see which family fits and why. */
export function FamiliesLab() {
  const [i, setI] = useState(0);
  const t = TASKS[i]!;
  return (
    <Panel title="Which family for which job?">
      <div role="group" aria-label="Task" className="flex flex-wrap gap-1.5">
        {TASKS.map((x, k) => (
          <button key={x.task} type="button" aria-pressed={k === i} onClick={() => setI(k)} className={`rounded-full border px-2.5 py-0.5 text-xs ${k === i ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-400"}`}>
            {x.task}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {(Object.keys(FAMILY_LABEL) as Family[]).map((f) => (
          <div key={f} className={`rounded-xl border p-3 text-sm ${f === t.family ? "border-emerald-500 bg-emerald-500/10 text-emerald-100" : "border-slate-800 text-slate-400"}`}>
            <div className="font-semibold">{FAMILY_LABEL[f]}</div>
            <div className="mt-1 text-xs">{f === "encoder" ? "sees everything · outputs vectors" : f === "decoder" ? "sees only the past · outputs next-token probabilities" : "reads with one, writes with the other"}</div>
          </div>
        ))}
      </div>
      <p role="status" className="mt-3 text-sm text-slate-200">
        <span className="font-semibold">{FAMILY_LABEL[t.family]}:</span> {t.why}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ training objectives */

type Objective = "next" | "masked" | "span";

export function nextTokenExamples(tokens: string[]): [string, string][] {
  return tokens.slice(1).map((t, i) => [tokens.slice(0, i + 1).join(" "), t]);
}

/** BERT's rule: choose 15% of positions (at least one); of those 80% → [MASK], 10% → random token, 10% unchanged. */
export function maskedExample(tokens: string[], rand: () => number): { input: string[]; targets: Record<number, string> } {
  const n = Math.max(1, Math.round(tokens.length * 0.15));
  const order = tokens.map((_, i) => i).sort(() => rand() - 0.5);
  const chosen = order.slice(0, n);
  const input = [...tokens];
  const targets: Record<number, string> = {};
  for (const i of chosen) {
    targets[i] = tokens[i]!;
    const r = rand();
    if (r < 0.8) input[i] = "[MASK]";
    else if (r < 0.9) input[i] = tokens[Math.floor(rand() * tokens.length)]!;
  }
  return { input, targets };
}

/** Lab: turn a sentence into training examples for each family's objective. */
export function ObjectiveLab({ rand = Math.random }: { rand?: () => number }) {
  const [text, setText] = useState("the cat sat on the mat by the door");
  const [objective, setObjective] = useState<Objective>("next");
  const [seed, setSeed] = useState(0);
  const tokens = text.split(/\s+/).filter(Boolean);
  const masked = (() => {
    void seed;
    return maskedExample(tokens, rand);
  })();
  const spanStart = Math.max(1, Math.floor(tokens.length / 3));
  const spanEnd = Math.min(tokens.length, spanStart + 2);
  return (
    <Panel title="Training examples from one sentence">
      <label className="block text-xs text-slate-400">
        Sentence
        <input value={text} onChange={(e) => setText(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100" />
      </label>
      <div className="mt-3">
        <Segmented<Objective>
          label="Objective"
          value={objective}
          options={[
            { value: "next", label: "Next token (decoder)" },
            { value: "masked", label: "Masked (encoder)" },
            { value: "span", label: "Span corruption (T5)" },
          ]}
          onChange={setObjective}
        />
      </div>
      {objective === "next" && (
        <ol aria-label="Examples" className="mt-3 space-y-1 font-mono text-xs">
          {nextTokenExamples(tokens).map(([ctx, t], i) => (
            <li key={i} className="text-slate-300">
              {ctx} → <span className="text-emerald-300">{t}</span>
            </li>
          ))}
        </ol>
      )}
      {objective === "masked" && (
        <div className="mt-3">
          <p aria-label="Masked input" className="font-mono text-sm text-slate-200">
            {masked.input.join(" ")}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Predict: {Object.entries(masked.targets).map(([i, t]) => `position ${i} = ${t}`).join(", ")} (using both sides)
          </p>
          <button type="button" className={`${btn} mt-2`} onClick={() => setSeed((s) => s + 1)}>
            <Dices size={14} aria-hidden="true" /> Mask again
          </button>
        </div>
      )}
      {objective === "span" && (
        <div className="mt-3 font-mono text-sm">
          <p className="text-slate-200">
            encoder reads: {[...tokens.slice(0, spanStart), "<X>", ...tokens.slice(spanEnd)].join(" ")}
          </p>
          <p className="mt-1 text-emerald-300">decoder writes: &lt;X&gt; {tokens.slice(spanStart, spanEnd).join(" ")}</p>
        </div>
      )}
      <p role="status" className="mt-3 text-xs text-slate-400">
        {objective === "next" ? `${Math.max(0, tokens.length - 1)} training examples from one ${tokens.length}-token sentence, all in one forward pass.` : objective === "masked" ? `${Object.keys(masked.targets).length} of ${tokens.length} positions produce a training signal.` : "One hidden span, written out by the decoder."}
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ everything as text in, text out */

const FRAMES: { task: string; decoder: string; encoder: string }[] = [
  { task: "Sentiment", decoder: "Review: “The film was great.”\nIs this review positive or negative? Answer:", encoder: "vector(review) → small classifier trained on labelled reviews → positive / negative" },
  { task: "Translation", decoder: "Translate to French: “The cat sleeps.”\nFrench:", encoder: "not natural: an encoder outputs vectors, not French text (needs a decoder on top)" },
  { task: "Question answering", decoder: "Context: … \nQuestion: When does the branch open?\nAnswer:", encoder: "vector per token → predict the start and end of the answer span inside the context" },
  { task: "Search", decoder: "possible but slow: ask the model about every document one by one", encoder: "vector(query) · vector(document) for every document → rank" },
];

/** Lab: one decoder does many tasks by phrasing them as text; an encoder needs a task-specific head. */
export function TaskFramingLab() {
  const [i, setI] = useState(0);
  const f = FRAMES[i]!;
  return (
    <Panel title="Every task as text in, text out">
      <div role="group" aria-label="Task" className="flex flex-wrap gap-1.5">
        {FRAMES.map((x, k) => (
          <button key={x.task} type="button" aria-pressed={k === i} onClick={() => setI(k)} className={`rounded-full border px-2.5 py-0.5 text-xs ${k === i ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-slate-700 text-slate-400"}`}>
            {x.task}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet-300">Decoder: just continue the text</div>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-slate-200">{f.decoder}</pre>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Encoder: vectors plus a task head</div>
          <p className="mt-2 font-mono text-xs text-slate-200">{f.encoder}</p>
        </div>
      </div>
      <p role="status" className="mt-2 text-xs text-slate-400">The decoder uses the same model and the same loop for every task; only the words change.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ real sizes on a log scale */

const byId = (id: string) => paramBreakdown(MODEL_CONFIGS.find((m) => m.id === id)!).total;
const SIZES: { name: string; family: Family; params: number; source: string }[] = [
  { name: "MiniLM-L6", family: "encoder", params: 22_713_216, source: "computed from its config.json" },
  { name: "T5-small", family: "encoder-decoder", params: 60e6, source: "T5 paper (Raffel et al. 2020)" },
  { name: "BERT-base", family: "encoder", params: 110e6, source: "BERT paper (Devlin et al. 2018)" },
  { name: "GPT-2 small", family: "decoder", params: byId("gpt2-small"), source: "computed from its config" },
  { name: "Llama 3 8B", family: "decoder", params: byId("llama3-8b"), source: "computed from its config" },
  { name: "GPT-3", family: "decoder", params: byId("gpt3-175b"), source: "computed from its paper's config" },
];

/** Lab: real model sizes across the three families, on a log scale. */
export function FamilySizesLab() {
  const [only, setOnly] = useState<Family | "all">("all");
  const shown = SIZES.filter((s) => only === "all" || s.family === only);
  const lo = Math.log10(1e7);
  const hi = Math.log10(2e11);
  return (
    <Panel title="Real sizes, side by side (log scale)">
      <Segmented<Family | "all">
        label="Show"
        value={only}
        options={[{ value: "all", label: "All" }, { value: "encoder", label: "Encoders" }, { value: "decoder", label: "Decoders" }, { value: "encoder-decoder", label: "Enc-dec" }]}
        onChange={setOnly}
      />
      <div className="mt-3">
        <ProbBars
          label="Parameters"
          format={(v) => short(10 ** (lo + v * (hi - lo)))}
          items={shown.map((s) => ({ label: s.name, value: (Math.log10(s.params) - lo) / (hi - lo), note: `${fmt(Math.round(s.params))} parameters (${s.family}; ${s.source})` }))}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Each step right is 10× more parameters. Hover a bar for the exact count and its source.</p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ reading a model card */

type Field = { key: string; value: string; means: string };
const gpt2 = MODEL_CONFIGS.find((m) => m.id === "gpt2-small")!;
const llama = MODEL_CONFIGS.find((m) => m.id === "llama3-8b")!;
const CARDS: Record<string, Field[]> = {
  "GPT-2 small": [
    { key: "architectures", value: '["GPT2LMHeadModel"]', means: "A decoder with a language-modelling head: it predicts the next token." },
    { key: "n_embd", value: String(gpt2.dModel), means: "The width d: numbers per token vector." },
    { key: "n_layer", value: String(gpt2.layers), means: "How many transformer blocks." },
    { key: "n_head", value: String(gpt2.heads), means: "Attention heads per block." },
    { key: "n_positions", value: String(gpt2.context), means: "The context window, in tokens." },
    { key: "vocab_size", value: String(gpt2.vocab), means: "Rows of the embedding table." },
  ],
  "Llama 3 8B": [
    { key: "architectures", value: '["LlamaForCausalLM"]', means: "A decoder (causal = left-to-right) for generating text." },
    { key: "hidden_size", value: String(llama.dModel), means: "The width d." },
    { key: "num_hidden_layers", value: String(llama.layers), means: "How many transformer blocks." },
    { key: "num_key_value_heads", value: String(llama.kvHeads), means: "Grouped-query attention: 32 query heads share 8 key/value heads." },
    { key: "intermediate_size", value: String(llama.ffn), means: "The feed-forward width." },
    { key: "tie_word_embeddings", value: String(llama.tiedEmbeddings), means: "false: a separate output head, not the embedding table reused." },
  ],
  "all-MiniLM-L6-v2": [
    { key: "architectures", value: '["BertModel"]', means: "An encoder: bidirectional, outputs vectors (no text-writing head)." },
    { key: "hidden_size", value: "384", means: "The width: 384 numbers per token, and per sentence after pooling." },
    { key: "num_hidden_layers", value: "6", means: "Six blocks: small and fast." },
    { key: "max_position_embeddings", value: "512", means: "Positions it has vectors for (the sentence model is used up to 256 word pieces)." },
    { key: "vocab_size", value: "30522", means: "BERT's WordPiece vocabulary." },
  ],
};

/** Lab: read real config.json fields and place the model: family, size, context. */
export function ModelCardLab() {
  const [model, setModel] = useState("GPT-2 small");
  const [field, setField] = useState(0);
  const fields = CARDS[model]!;
  const f = fields[Math.min(field, fields.length - 1)]!;
  return (
    <Panel title="Reading a real config.json">
      <Segmented label="Model" value={model} options={Object.keys(CARDS).map((k) => ({ value: k, label: k }))} onChange={(m) => { setModel(m); setField(0); }} />
      <pre aria-label="config.json" className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs">
        {"{\n"}
        {fields.map((x, i) => (
          <button key={x.key} type="button" onClick={() => setField(i)} className={`block w-full rounded px-1 text-left ${i === field ? "bg-violet-500/15 text-violet-200" : "text-slate-300 hover:bg-slate-800"}`}>
            {`  "${x.key}": ${x.value},`}
          </button>
        ))}
        {"}"}
      </pre>
      <p role="status" className="mt-2 text-sm text-slate-200">
        <span className="font-mono text-violet-300">{f.key}</span>: {f.means}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">Fields and values from each model&apos;s published config.json (a selection).</p>
    </Panel>
  );
}
