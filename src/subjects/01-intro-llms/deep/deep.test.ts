// @vitest-environment node
/**
 * Every deep lesson in Module 01 meets the depth standard, every exercise solution passes its checks
 * while the untouched starter does not, and every worked-example table is exactly what its script prints.
 * Runs real Python (Pyodide, same release as the page).
 */
import { getEncoding } from "js-tiktoken";
import { loadPyodide, type PyodideInterface } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";
import { validateDeep } from "../../../core/deep";
import { PYODIDE_CDN } from "../../../py/program";
import { runInPyodide } from "../../../py/runCore";
import { steps } from "../steps";
import { content } from ".";

const deepData = content.data;

/** Steps converted so far; the last content task asserts this is all 12. */
const DEEP_STEPS = ["big-picture", "anatomy", "how-large", "train-vs-use", "bag-of-words", "dense-embeddings", "context", "architectures", "encoder-decoder", "representation-vs-generative", "pretraining-finetuning", "recap"];

const WORKED = import.meta.glob("./worked/*.py", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

let py: PyodideInterface;
beforeAll(async () => {
  py = await loadPyodide({ packageBaseUrl: PYODIDE_CDN });
  await py.loadPackage("numpy", { messageCallback: () => {} });
}, 180_000);

/** Runs a worked-example script with the same DATA map the page uses (DATA["minilm"], …). */
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

/** Each converted step with its loaded lesson attached, so the checks below read `step.deep!`. */
const deepSteps = DEEP_STEPS.map((id) => {
  const s = steps.find((x) => x.id === id);
  if (!s) throw new Error(`no step ${id}`);
  return { ...s, deep: content.lessons[id] };
});

describe.each(deepSteps.map((s) => [s.id, s] as const))("deep lesson %s", (_id, step) => {
  it("meets the depth standard", () => {
    expect(step.deep, "step has no deep lesson").toBeDefined();
    expect(validateDeep(step.deep!)).toEqual([]);
  });

  it("each exercise solution passes and each starter fails its checks without crashing", async () => {
    const ex = step.deep!.build;
    const data = ex.data ? deepData[ex.data] : null;
    if (ex.data) expect(data, `deepData.${ex.data}`).toBeDefined();
    for (const [i, part] of ex.parts.entries()) {
      const prelude = ex.parts.slice(0, i).map((p) => p.solution).join("\n\n");
      const base = { prelude, checks: part.checks, data, packages: ex.packages };
      const good = await runInPyodide(py, { ...base, learnerCode: part.solution });
      expect(good, `${part.id} solution`).toMatchObject({ status: "pass", error: null });
      const starter = await runInPyodide(py, { ...base, learnerCode: part.starter });
      // The untouched starter runs without crashing and fails its checks, so a first Run shows what to fix.
      expect(starter, `${part.id} starter must fail its checks cleanly`).toMatchObject({ status: "fail", error: null });
    }
  }, 60_000);

  it("worked tables equal what their scripts print", () => {
    for (const b of step.deep!.worked) {
      if (b.kind !== "table") continue;
      const src = WORKED[`./${b.source}`];
      expect(src, `missing ${b.source}`).toBeDefined();
      const printed = JSON.parse(runScript(src!)) as Record<string, unknown>;
      expect(printed[b.caption], `${b.source} → "${b.caption}"`).toEqual(b.rows);
    }
  });

  it("starts every hint list and keeps exercise parts short", () => {
    for (const p of step.deep!.build.parts) {
      expect(p.hints.length, `${p.id} hints`).toBeGreaterThanOrEqual(1);
      expect(p.solution.split("\n").length, `${p.id} solution length`).toBeLessThanOrEqual(36);
    }
  });
});

const LOCAL_SRC = import.meta.glob("./local/*.py", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const CAPTURED = import.meta.glob("./local-outputs.json", { import: "default", eager: true }) as Record<string, Record<string, { code: string; output: string; packages: Record<string, string> }>>;

describe("run-it-locally listings", () => {
  const captured = CAPTURED["./local-outputs.json"] ?? {};
  const listings = Object.entries(content.lessons).flatMap(([sid, d]) => d.local.map((l) => [sid, l] as const));

  it("the four planned listings are attached", () => {
    expect(listings.map(([, l]) => l.id).sort()).toEqual(["context", "dense", "encdec", "repgen"]);
  });

  it.each(listings.map(([sid, l]) => [`${sid}/${l.id}`, l] as const))("%s shows code that was actually run, with its real output", (_k, l) => {
    const cap = captured[l.id];
    expect(cap, `no captured run for ${l.id}: run scripts/capture-local-outputs.mjs`).toBeDefined();
    expect(LOCAL_SRC[`./local/${l.id}.py`]).toBe(cap!.code);
    expect(l.code).toBe(cap!.code);
    expect(l.output).toBe(cap!.output);
    expect(l.output.trim().length).toBeGreaterThan(0);
    const named = l.install.replace(/^pip install /, "").split(" ").map((t) => t.split("==") as [string, string]);
    for (const [pkg, v] of named) expect(v, `${pkg} pin`).toBe(cap!.packages[pkg]);
  });
});

describe("Module 01 coverage", () => {
  it("every step is a deep lesson, and each exercise id is unique", () => {
    expect(DEEP_STEPS).toEqual(steps.map((s) => s.id));
    expect(steps.every((s) => s.deep === true)).toBe(true);
    expect(Object.keys(content.lessons).sort()).toEqual([...DEEP_STEPS].sort());
    const ids = Object.values(content.lessons).map((d) => d.build.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("facts quoted in the lessons", () => {
  it("GPT-2 token IDs for “The cat sat”", () => {
    expect(getEncoding("gpt2").encode("The cat sat")).toEqual([464, 3797, 3332]);
  });
});
