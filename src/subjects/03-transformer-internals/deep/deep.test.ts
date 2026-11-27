// @vitest-environment node
/**
 * Every deep lesson in Module 03 meets the depth standard, every exercise solution passes its checks while the
 * untouched starter fails them cleanly, and every worked-example table is exactly what its script prints.
 * Runs real Python (Pyodide, same release as the page).
 */
import { loadPyodide, type PyodideInterface } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";
import { validateDeep } from "../../../core/deep";
import { PYODIDE_CDN } from "../../../py/program";
import { runInPyodide } from "../../../py/runCore";
import { steps } from "../steps";
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

describe("Module 03 deep lessons are wired", () => {
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
  // Forgets biases, the position table and the final norm: must not match the published totals.
  ["forward-pass", "p2", 'M = {m["name"]: m for m in DATA["models"]}\ndef gpt2_block_params(d, f):\n    return 4 * d * d, 2 * d * f, 2 * d\ndef gpt2_total(cfg):\n    d = cfg["d_model"]\n    return cfg["vocab"] * d + cfg["layers"] * sum(gpt2_block_params(d, cfg["ffn"]))'],
  // Shifts instead of rotating: lengths change and scores depend on absolute position.
  // Forgets the √d scaling.
  ["qkv", "p2", "import numpy as np\ndef scores(Q, K):\n    return Q @ K.T\ndef softmax_rows(S):\n    e = np.exp(S - S.max(axis=1, keepdims=True))\n    return e / e.sum(axis=1, keepdims=True)"],
  // Masks after the softmax by zeroing: rows no longer sum to 1.
  ["self-attention", "p1", "import numpy as np\nATTN = np.array(DATA['gpt2']['sentences'][0]['attn'])\ndef causal_softmax(S):\n    S = np.array(S, dtype=float)\n    e = np.exp(S - S.max(axis=1, keepdims=True))\n    W = e / e.sum(axis=1, keepdims=True)\n    return np.tril(W)\ndef is_causal(W):\n    return bool(np.all(np.triu(np.asarray(W), k=1) == 0))"],
  // Tiles the KV heads instead of repeating each one: query head 1 would read KV head 1, not 0.
  ["gqa", "p2", "import numpy as np\ndef repeat_kv(K, n_rep):\n    return np.tile(np.asarray(K), (n_rep, 1, 1))"],
  // Normalises over the whole matrix instead of each token's own vector.
  ["residual-norm", "p1", "import numpy as np\ndef layer_norm(x, gain, bias, eps=1e-5):\n    x = np.asarray(x, dtype=float)\n    return (x - x.mean()) / np.sqrt(x.var() + eps) * gain + bias\ndef rms_norm(x, gain, eps=1e-6):\n    x = np.asarray(x, dtype=float)\n    return x / np.sqrt((x ** 2).mean() + eps) * gain"],
  // Swaps which half is gated: the content goes through SiLU instead of the gate.
  ["ffn", "p2", "import numpy as np\ndef ffn_gelu(X, W1, b1, W2, b2):\n    return gelu(X @ W1 + b1) @ W2 + b2\ndef ffn_swiglu(X, Wg, Wu, Wd):\n    return ((X @ Wg) * silu(X @ Wu)) @ Wd"],
  ["positional", "p2", "import numpy as np\ndef rope(x, pos):\n    return np.asarray(x, dtype=float) + pos"],
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
