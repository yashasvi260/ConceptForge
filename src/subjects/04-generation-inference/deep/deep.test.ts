// @vitest-environment node
/**
 * Every deep lesson in Module 04 meets the depth standard, every exercise solution passes its checks while the
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

describe("Module 04 deep lessons are wired", () => {
  it("the converted steps are deep lessons", () => {
    expect(steps.filter((s) => s.deep).map((s) => s.id)).toEqual(["logits", "decoding"]);
  });

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
  // Softmax without subtracting the max: exp(1000) overflows.
  ["logits", "p2", "import numpy as np\ndef softmax(z):\n    z = np.asarray(z, dtype=float)\n    return np.exp(z) / np.exp(z).sum()\ndef log_softmax(z):\n    return np.log(softmax(z))"],
  // Perplexity as 2^loss with a natural-log loss.
  ["logits", "p3", "import numpy as np\ndef entropy_bits(p):\n    p = np.asarray(p, dtype=float); p = p[p > 0]\n    return float(-(p * np.log2(p)).sum())\ndef mean_loss(p_actual):\n    return float(-np.mean(np.log(p_actual)))\ndef perplexity(p_actual):\n    return float(2 ** mean_loss(p_actual))"],
  // Multiplies the logits by T instead of dividing: low T flattens.
  ["decoding", "p1", "import numpy as np\ndef softmax_t(z, T):\n    s = np.asarray(z, dtype=float) * T\n    e = np.exp(s - s.max())\n    return e / e.sum()\ndef greedy(z):\n    return int(np.argmax(z))"],
  // Samples uniformly, ignoring the probabilities.
  ["decoding", "p2", "import numpy as np\ndef sample(p, rng):\n    return int(rng.integers(len(p)))"],
  // Forgets to add up the log-probabilities: each beam is scored by its last token only.
  ["decoding", "p3", "def beam_search(next_logprobs, start, steps, width):\n    beams = [(list(start), 0.0)]\n    for _ in range(steps):\n        grown = [(seq + [t], lp) for seq, score in beams for t, lp in next_logprobs(seq).items()]\n        beams = sorted(grown, key=lambda b: -b[1])[:width]\n    return beams[0]"],
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
