// @vitest-environment node
import { loadPyodide, type PyodideInterface } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";
import { MAX_OUTPUT, PYODIDE_CDN, type RunRequest } from "./program";
import { runInPyodide } from "./runCore";

let py: PyodideInterface;
beforeAll(async () => {
  py = await loadPyodide({ packageBaseUrl: PYODIDE_CDN });
}, 120_000);

const CHECK_X = `def check_x_is_two(ns):\n    assert ns["x"] == 2, "x should be 2"\n`;
const req = (learnerCode: string, extra: Partial<RunRequest> = {}): RunRequest => ({
  learnerCode,
  prelude: "",
  checks: CHECK_X,
  data: null,
  packages: [],
  ...extra,
});

describe("runInPyodide", () => {
  it("passes when every check holds, naming checks from their function names", async () => {
    const r = await runInPyodide(py, req("x = 2\nprint('hi')"));
    expect(r.status).toBe("pass");
    expect(r.checks).toEqual([{ name: "x is two", ok: true, message: "" }]);
    expect(r.stdout).toBe("hi\n");
  });

  it("fails with the assertion message", async () => {
    const r = await runInPyodide(py, req("x = 3"));
    expect(r.status).toBe("fail");
    expect(r.checks[0]).toEqual({ name: "x is two", ok: false, message: "x should be 2" });
  });

  it("reports learner exceptions by their own line number, without harness frames", async () => {
    const r = await runInPyodide(py, req("x = 2\ny = 1/0"));
    expect(r.status).toBe("error");
    expect(r.error).toMatch(/^line 2: ZeroDivisionError/);
    expect(r.error).not.toMatch(/harness/i);
    expect(r.checks).toEqual([]);
  });

  it("reports syntax errors by line", async () => {
    const r = await runInPyodide(py, req("x = 2\ndef f(:\n"));
    expect(r.status).toBe("error");
    expect(r.error).toMatch(/^line 2: SyntaxError/);
  });

  it("cannot be fooled by learner code redefining a check", async () => {
    const r = await runInPyodide(py, req("def check_x_is_two(ns):\n    return None\nx = 3"));
    expect(r.status).toBe("fail");
  });

  it("gives checks their own copy of DATA", async () => {
    const checks = `def check_data_intact(ns):\n    assert DATA["n"] == 5\n    assert ns["got"] == 5\n`;
    const r = await runInPyodide(py, req('got = DATA["n"]\nDATA["n"] = 0\ndel DATA', { checks, data: { n: 5 } }));
    expect(r.status).toBe("pass");
  });

  it("caps very long output", async () => {
    const r = await runInPyodide(py, req('print("a" * 50000)\nx = 2'));
    expect(r.stdout.length).toBeLessThanOrEqual(MAX_OUTPUT + 30);
    expect(r.stdout.endsWith("… output truncated")).toBe(true);
  });

  it("counts zero checks as a fail", async () => {
    const r = await runInPyodide(py, req("x = 2", { checks: "" }));
    expect(r.status).toBe("fail");
  });

  it("runs the prelude before the learner code", async () => {
    const r = await runInPyodide(py, req("x = base + 1", { prelude: "base = 1" }));
    expect(r.status).toBe("pass");
  });

  it("does not leak state between runs", async () => {
    await runInPyodide(py, req("leak = 1\nx = 2"));
    const r = await runInPyodide(py, req("x = 2 if 'leak' not in dir() else 9"));
    expect(r.status).toBe("pass");
  });

  it("loads numpy when asked", async () => {
    const checks = `def check_sum(ns):\n    assert ns["v"].sum() == 3\n`;
    const r = await runInPyodide(py, req("import numpy as np\nv = np.ones(3)", { checks, packages: ["numpy"] }));
    expect(r.status).toBe("pass");
  }, 60_000);
});
