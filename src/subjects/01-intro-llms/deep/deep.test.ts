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
import { deepData } from "./data";
import { steps } from "../steps";

/** Steps converted so far; the last content task asserts this is all 12. */
const DEEP_STEPS = ["big-picture", "anatomy", "how-large"];

const WORKED = import.meta.glob("./worked/*.py", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

let py: PyodideInterface;
beforeAll(async () => {
  py = await loadPyodide({ packageBaseUrl: PYODIDE_CDN });
  await py.loadPackage("numpy", { messageCallback: () => {} });
}, 180_000);

function runScript(src: string): string {
  let out = "";
  py.setStdout({ batched: (s) => (out += s + "\n") });
  try {
    py.runPython(src, { globals: py.toPy({}) });
  } finally {
    py.setStdout();
  }
  return out;
}

const deepSteps = DEEP_STEPS.map((id) => {
  const s = steps.find((x) => x.id === id);
  if (!s) throw new Error(`no step ${id}`);
  return s;
});

describe.each(deepSteps.map((s) => [s.id, s] as const))("deep lesson %s", (_id, step) => {
  it("meets the depth standard", () => {
    expect(step.deep, "step has no deep lesson").toBeDefined();
    expect(validateDeep(step.deep!)).toEqual([]);
  });

  it("each exercise solution passes and each starter does not", async () => {
    const ex = step.deep!.build;
    const data = ex.data ? deepData[ex.data] : null;
    if (ex.data) expect(data, `deepData.${ex.data}`).toBeDefined();
    for (const [i, part] of ex.parts.entries()) {
      const prelude = ex.parts.slice(0, i).map((p) => p.solution).join("\n\n");
      const base = { prelude, checks: part.checks, data, packages: ex.packages };
      const good = await runInPyodide(py, { ...base, learnerCode: part.solution });
      expect(good, `${part.id} solution`).toMatchObject({ status: "pass", error: null });
      const starter = await runInPyodide(py, { ...base, learnerCode: part.starter });
      expect(starter.status, `${part.id} starter must not pass`).not.toBe("pass");
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

describe("facts quoted in the lessons", () => {
  it("GPT-2 token IDs for “The cat sat”", () => {
    expect(getEncoding("gpt2").encode("The cat sat")).toEqual([464, 3797, 3332]);
  });
});
