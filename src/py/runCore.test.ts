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

  it("undoes learner changes to builtins and modules before the checks and the next run", async () => {
    const absCheck = `def check_close(ns):\n    assert abs(ns["f"]() - 0.5) < 1e-9, "f() should be 0.5"\n`;
    await runInPyodide(py, req("import builtins, json\nbuiltins.abs = lambda x: 0\nbuiltins.print = lambda *a, **k: None\njson.dumps = lambda *a, **k: 'x'\nx = 2"));
    const r = await runInPyodide(py, req("def f():\n    return 123\nprint('visible')", { checks: absCheck }));
    expect(r.status).toBe("fail");
    expect(r.stdout).toBe("visible\n");
    const same = await runInPyodide(py, req("import builtins\nbuiltins.abs = lambda x: 0\ndef f():\n    return 123", { checks: absCheck }));
    expect(same.status).toBe("fail");
  });

  it("reports a KeyError inside learner code as an error in their code, not a missing name", async () => {
    const checks = `def check_lookup(ns):\n    assert ns["f"]() == 1\n`;
    const r = await runInPyodide(py, req("def f():\n    return {}['zzz']", { checks }));
    expect(r.checks[0]!.ok).toBe(false);
    expect(r.checks[0]!.message).toMatch(/^line 2: KeyError/);
    const missing = await runInPyodide(py, req("y = 1", { checks }));
    expect(missing.checks[0]!.message).toBe("f is not defined yet");
  });

  it("undoes a patched numpy function too", async () => {
    const checks = `import numpy as np\ndef check_close(ns):\n    assert np.allclose(ns["v"], [1, 2]), "v should be [1, 2]"\n`;
    const r = await runInPyodide(py, req("import numpy as np\nnp.allclose = lambda *a, **k: True\nv = np.array([9, 9])", { checks, packages: ["numpy"] }));
    expect(r.status).toBe("fail");
  }, 60_000);

  it("keeps numpy's lazily imported submodules working across runs", async () => {
    const checks = `import numpy as np\ndef check_rng(ns):\n    assert np.random.default_rng(0).normal(size=2).shape == (2,)\n`;
    for (let k = 0; k < 2; k++) {
      const r = await runInPyodide(py, req("import numpy as np\nv = np.random.default_rng(1).normal(size=3)\nw = np.linalg.norm(v)", { checks, packages: ["numpy"] }));
      expect(r.status).toBe("pass");
    }
  }, 60_000);
});
