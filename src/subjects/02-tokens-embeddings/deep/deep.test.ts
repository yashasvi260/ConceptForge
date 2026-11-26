// @vitest-environment node
/**
 * Every deep lesson in Module 02 meets the depth standard, every exercise solution passes its checks while the
 * untouched starter fails them cleanly, and every worked-example table is exactly what its script prints.
 * Runs real Python (Pyodide, same release as the page).
 */
import { loadPyodide, type PyodideInterface } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";
import { validateDeep } from "../../../core/deep";
import { PYODIDE_CDN } from "../../../py/program";
import { runInPyodide } from "../../../py/runCore";
import { encodeBpe, trainBpe } from "../bpe";
import { steps } from "../steps";
import { bestSegmentation } from "../unigram";
import { encodeWordPiece, parseVocab } from "../wordpiece";
import bertVocabText from "../data/bert-base-uncased-vocab.txt?raw";
import { LANGUAGE_SAMPLES } from "../views/LanguagesView";
import { content } from ".";

const deepData = content.data;
const WORKED = import.meta.glob("./worked/*.py", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

let py: PyodideInterface;
beforeAll(async () => {
  py = await loadPyodide({ packageBaseUrl: PYODIDE_CDN });
  await py.loadPackage("numpy", { messageCallback: () => {} });
}, 180_000);

/** Runs a worked-example script with the same DATA map the page uses. */
function runScript(src: string): string {
  let out = "";
  py.setStdout({ batched: (s) => (out += s + "\n") });
  try {
    const globals = py.toPy({});
    globals.set("_data_json", JSON.stringify(deepData));
    py.runPython("import json\nDATA = json.loads(_data_json)", { globals });
    py.runPython(src, { globals });
  } finally {
    py.setStdout();
  }
  return out;
}

/** Steps marked deep, in step order, each with its lesson attached. */
const deepSteps = steps.filter((s) => s.deep).map((s) => ({ ...s, lesson: content.lessons[s.id] }));

describe("Module 02 deep lessons are wired", () => {
  it("every step marked deep has a lesson, and every lesson's step is marked deep", () => {
    expect(deepSteps.map((s) => s.id)).toEqual(steps.filter((s) => content.lessons[s.id]).map((s) => s.id));
    expect(deepSteps.length).toBe(Object.keys(content.lessons).length);
  });

  it("each exercise id is unique", () => {
    const ids = Object.values(content.lessons).map((d) => d.build.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe.each(deepSteps.map((s) => [s.id, s] as const))("deep lesson %s", (_id, step) => {
  it("meets the depth standard", () => {
    expect(validateDeep(step.lesson!)).toEqual([]);
  });

  it("each exercise solution passes and each starter fails its checks without crashing", async () => {
    const ex = step.lesson!.build;
    const data = ex.data ? deepData[ex.data] : null;
    if (ex.data) expect(data, `deepData.${ex.data}`).toBeDefined();
    for (const [i, part] of ex.parts.entries()) {
      const prelude = ex.parts.slice(0, i).map((p) => p.solution).join("\n\n");
      const base = { prelude, checks: part.checks, data, packages: ex.packages };
      const good = await runInPyodide(py, { ...base, learnerCode: part.solution });
      expect(good, `${part.id} solution`).toMatchObject({ status: "pass", error: null });
      const starter = await runInPyodide(py, { ...base, learnerCode: part.starter });
      expect(starter, `${part.id} starter must fail its checks cleanly`).toMatchObject({ status: "fail", error: null });
    }
  }, 60_000);

  it("worked tables equal what their scripts print", () => {
    for (const b of step.lesson!.worked) {
      if (b.kind !== "table") continue;
      const src = WORKED[`./${b.source}`];
      expect(src, `missing ${b.source}`).toBeDefined();
      const printed = JSON.parse(runScript(src!)) as Record<string, unknown>;
      expect(printed[b.caption], `${b.source} → "${b.caption}"`).toEqual(b.rows);
    }
  });

  it("has hints for every part and keeps parts short", () => {
    for (const p of step.lesson!.build.parts) {
      expect(p.hints.length, `${p.id} hints`).toBeGreaterThanOrEqual(1);
      expect(p.solution.split("\n").length, `${p.id} solution length`).toBeLessThanOrEqual(36);
    }
  });
});

/** Plausible wrong answers that must NOT pass: checks have to test the concept, not just the shape. */
const WRONG: [step: string, part: string, code: string][] = [
  ["bytes", "p3", "import codecs\nTOKENS = DATA['byte_tokens']\ndef safe_stream(tokens):\n    return [bytes(t['bytes']).decode('utf-8', errors='replace') for t in tokens]"],
  ["special-tokens", "p2", "SPECIAL = DATA['llama3']\ndef naive_encode(prompt_text, encode_text):\n    ids, i = [], 0\n    while i < len(prompt_text):\n        hit = next((t for t in SPECIAL if prompt_text.startswith(t, i)), None)\n        if hit:\n            ids.append(SPECIAL[hit]); i += len(hit)\n        else:\n            ids += encode_text(prompt_text[i]); i += 1\n    return ids\ndef encode_turns(messages, encode_text):\n    return naive_encode(llama3_prompt(messages), encode_text)[:-3]"],
  ["quirks", "p3", "def chunk(ids, size, overlap):\n    return [ids[i:i + size] for i in range(0, len(ids), size)]"],
  ["lookup-table", "p3", "import numpy as np\ndef table_gradient(V, ids, grad_rows):\n    G = np.zeros((V, grad_rows.shape[1]))\n    G[ids] += grad_rows\n    return G"],
  ["sentence-embeddings", "p1", "import numpy as np\ndef mean_pool(token_vectors, mask):\n    X, m = np.asarray(token_vectors, dtype=float), np.asarray(mask, dtype=float)\n    return (X * m[:, None]).sum(axis=0) / m.sum()"],
  ["vocabulary", "p3", "def table_params(vocab, d_model):\n    return vocab * d_model\n\ndef vocab_share(model):\n    return 100 * table_params(model['vocab'], model['d_model']) / model['total_params']\n\ndef extra_params(old_vocab, new_vocab, d_model, tied):\n    return (new_vocab - old_vocab) * d_model"],
  ["why-numbers", "p1", "def split_words(text):\n    return text.split()\n\ndef split_chars(text):\n    return list(text)\n\ndef split_bytes(text):\n    return list(text)"],
];

describe("wrong answers fail", () => {
  it.each(WRONG.filter(([s]) => content.lessons[s]))("%s %s", async (stepId, partId, code) => {
    const ex = content.lessons[stepId]!.build;
    const i = ex.parts.findIndex((p) => p.id === partId);
    const r = await runInPyodide(py, {
      learnerCode: code,
      prelude: ex.parts.slice(0, i).map((p) => p.solution).join("\n\n"),
      checks: ex.parts[i]!.checks,
      data: ex.data ? deepData[ex.data] : null,
      packages: ex.packages,
    });
    expect(r.status).toBe("fail");
  });
});

describe("generated data matches the page", () => {
  it("the Unigram exercise's Viterbi finds the same best split as the page's", () => {
    const parts = content.lessons.sentencepiece!.build.parts.slice(0, 2).map((p) => p.solution.replace(/\n(print\(normalize|for t in)[\s\S]*$/, "")).join("\n\n");
    const globals = py.toPy({});
    globals.set("_u", JSON.stringify(deepData.unigram));
    py.runPython(`import json\nDATA = json.loads(_u)\n${parts}`, { globals });
    for (const t of ["hello world", "unbelievable", "tokenization", "strawberry fields", "the cat sat on the mat", "日本語", "playing words", "zzz qx"]) {
      const got = (py.runPython(`viterbi(${JSON.stringify(t)})[0]`, { globals }) as { toJs: () => string[] }).toJs();
      expect(got, t).toEqual(bestSegmentation(t).pieces);
    }
  });

  it("the WordPiece slice is exact: the exercise splits every word like the page does with BERT's full vocabulary", () => {
    const full = parseVocab(bertVocabText);
    const wp = deepData.wordpiece as { words: string[]; vocab: Record<string, number> };
    const sol = content.lessons.wordpiece!.build.parts[0]!.solution.replace(/\nfor w in[\s\S]*$/, "");
    const globals = py.toPy({});
    globals.set("_wp", JSON.stringify(wp));
    py.runPython(`import json\nDATA = json.loads(_wp)\n${sol}`, { globals });
    for (const w of wp.words) {
      const got = (py.runPython(`longest_match(${JSON.stringify(w)}, VOCAB)`, { globals }) as { toJs: () => string[] }).toJs();
      expect(got, w).toEqual(encodeWordPiece(w, full).tokens.map((t) => t.text));
    }
  });

  it("the BPE encoding exercise splits words exactly like the page's encoder", () => {
    const parts = content.lessons["bpe-encoding"]!.build.parts.map((p) => p.solution.replace(/\n(for w in|toks = encode_text)[\s\S]*$/, "")).join("\n\n");
    const merges = trainBpe(String((deepData.bpe as { corpus: string }).corpus), 10).merges;
    const globals = py.toPy({});
    globals.set("_merges", JSON.stringify(merges.map((m) => m.pair)));
    py.runPython(`import json\nDATA = {"merges": json.loads(_merges)}\n${parts}`, { globals });
    for (const w of ["lowest", "newer", "slowly", "wider", "newest", "lower", "widest", "flower", "lowlow"]) {
      const got = (py.runPython(`encode_by_rank(${JSON.stringify(w)}, MERGES)`, { globals }) as { toJs: () => string[] }).toJs();
      expect(got, w).toEqual(encodeBpe(w, merges).tokens);
    }
  });

  it("the BPE exercise's solution learns the same merges as the page's trainer, on another corpus too", () => {
    const parts = content.lessons["bpe-training"]!.build.parts.map((p) => p.solution.replace(/\nmerges = train_bpe[\s\S]*$|\nwords = start_words[\s\S]*$/, "")).join("\n\n");
    const corpus = "the quick brown fox jumps over the lazy dog the dog barks and the fox runs";
    const globals = py.toPy({});
    py.runPython(parts, { globals });
    const got = (py.runPython(`[list(m) for m in train_bpe(${JSON.stringify(corpus)}, 25)]`, { globals }) as { toJs: () => string[][] }).toJs();
    expect(got).toEqual(trainBpe(corpus, 25).merges.map((m) => m.pair));
  });

  it("the token data covers exactly the Languages view's samples", () => {
    const langs = (deepData.tokens as { languages: { label: string; text: string }[] }).languages;
    expect(langs.map((l) => [l.label, l.text])).toEqual(LANGUAGE_SAMPLES.map((l) => [l.label, l.text]));
  });
});

const LOCAL_SRC = import.meta.glob("./local/*.py", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const CAPTURED = import.meta.glob("./local-outputs.json", { import: "default", eager: true }) as Record<string, Record<string, { code: string; output: string; packages: Record<string, string> }>>;

describe("run-it-locally listings", () => {
  const captured = CAPTURED["./local-outputs.json"] ?? {};
  const listings = Object.values(content.lessons).flatMap((d) => d.local);
  it("every listing has a captured run", () => {
    for (const l of listings) expect(captured[l.id], l.id).toBeDefined();
  });
  it.each(listings.map((l) => [l.id, l] as const))("%s shows code that was actually run, with its real output", (_k, l) => {
    const cap = captured[l.id];
    expect(cap, `no captured run for ${l.id}: run scripts/capture-local-outputs.mjs`).toBeDefined();
    expect(LOCAL_SRC[`./local/${l.id}.py`]).toBe(cap!.code);
    expect(l.code).toBe(cap!.code);
    expect(l.output).toBe(cap!.output);
    const named = l.install.replace(/^pip install /, "").split(" ").map((t) => t.split("==") as [string, string]);
    for (const [pkg, v] of named) expect(v, `${pkg} pin`).toBe(cap!.packages[pkg]);
  });
});
