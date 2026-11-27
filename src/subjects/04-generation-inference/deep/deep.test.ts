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
  it("all 7 steps are deep lessons", () => {
    expect(steps.map((s) => s.id)).toEqual(["logits", "decoding", "truncation", "generation-loop", "kv-cache", "long-context", "recap"]);
    expect(steps.every((s) => s.deep === true)).toBe(true);
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
  // Top-k that keeps the first k entries instead of the k largest.
  ["truncation", "p1", "import numpy as np\ndef top_k_filter(z, k):\n    z = np.asarray(z, dtype=float)\n    out = np.full_like(z, -np.inf)\n    out[:k] = z[:k]\n    return out\ndef softmax(z):\n    z = np.asarray(z, dtype=float)\n    e = np.exp(z - z.max())\n    return e / e.sum()"],
  // Top-p that stops just BEFORE the total reaches p: the nucleus is one token short.
  ["truncation", "p2", "import numpy as np\ndef top_p_mask(p, top_p):\n    p = np.asarray(p, dtype=float)\n    order = np.argsort(-p)\n    cum = np.cumsum(p[order])\n    n = max(1, int((cum < top_p).sum()))\n    mask = np.zeros(len(p), dtype=bool)\n    mask[order[:n]] = True\n    return mask"],
  // Truncates before applying the temperature.
  ["truncation", "p3", "import numpy as np\ndef min_p_mask(p, min_p):\n    p = np.asarray(p, dtype=float)\n    return p >= min_p * p.max()\ndef sample_chain(z, rng, temperature=1.0, top_k=0, top_p=1.0, min_p=0.0):\n    z = np.asarray(z, dtype=float)\n    if top_k:\n        z = top_k_filter(z, top_k)\n    p = softmax(z)\n    if top_p < 1.0:\n        p = np.where(top_p_mask(p, top_p), p, 0.0); p /= p.sum()\n    if min_p > 0.0:\n        p = np.where(min_p_mask(p, min_p), p, 0.0); p /= p.sum()\n    p = p ** (1 / temperature); p /= p.sum()\n    return int(np.searchsorted(np.cumsum(p), rng.random(), side='right'))"],
  // Includes the end-of-sequence token in the output.
  ["generation-loop", "p1", "def generate(next_token, prompt_ids, max_new_tokens, eos_id):\n    ids = list(prompt_ids); new = []\n    for _ in range(max_new_tokens):\n        t = next_token(ids)\n        ids.append(t); new.append(t)\n        if t == eos_id:\n            break\n    return new"],
  // Cuts at the first stop sequence in the LIST, not the earliest in the text.
  ["generation-loop", "p2", "def cut_at_stop(text, stops):\n    for s in stops:\n        if s in text:\n            return text[: text.find(s)], True\n    return text, False"],
  // Divides every seen logit by the penalty: negative logits become MORE likely.
  ["generation-loop", "p3", "import numpy as np\ndef repetition_penalty(logits, seen_ids, penalty):\n    out = np.array(logits, dtype=float)\n    for i in set(seen_ids):\n        out[i] = out[i] / penalty\n    return out"],
  // Attends to the whole cache but forgets to append the new token's own key and value first.
  ["kv-cache", "p1", "import numpy as np\nrng = np.random.default_rng(0)\nd = 8\nWq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))\ndef attend_all(X):\n    Q, K, V = X @ Wq, X @ Wk, X @ Wv\n    S = Q @ K.T / np.sqrt(d)\n    S = np.where(np.tril(np.ones_like(S)) == 1, S, -np.inf)\n    W = np.exp(S - S.max(axis=1, keepdims=True)); W /= W.sum(axis=1, keepdims=True)\n    return W @ V\ndef attend_step(x_new, cache):\n    q, k, v = x_new @ Wq, x_new @ Wk, x_new @ Wv\n    if not cache['K']:\n        cache['K'].append(k); cache['V'].append(v)\n        return v\n    K, V = np.stack(cache['K']), np.stack(cache['V'])\n    s = K @ q / np.sqrt(d)\n    w = np.exp(s - s.max()); w /= w.sum()\n    cache['K'].append(k); cache['V'].append(v)\n    return w @ V"],
  // Counts one key-value vector per layer per KV head (forgets that keys AND values are stored).
  ["kv-cache", "p2", "M = {m['name']: m for m in DATA['models']}\ndef kv_bytes_per_token(m, bytes_per_number=2):\n    return m['layers'] * m['kv_heads'] * (m['d_model'] // m['heads']) * bytes_per_number\ndef cache_numbers(shape, layers):\n    n = 1\n    for s in shape:\n        n *= s\n    return layers * n"],
  // Forgets that every layer attends: counts attention for one layer only.
  ["long-context", "p1", "def flops_per_token(n_params, layers, d_model, context):\n    return 2 * n_params + 2 * context * d_model\ndef attention_share(n_params, layers, d_model, context):\n    a = 2 * context * d_model\n    return a / (2 * n_params + a)\ndef crossover(n_params, layers, d_model):\n    return n_params / d_model"],
  // Forgets causality: the window looks both ways.
  ["long-context", "p2", "import numpy as np\ndef sliding_window_mask(n, window):\n    i = np.arange(n)[:, None]; j = np.arange(n)[None, :]\n    return np.abs(i - j) < window"],
  // Stretches positions instead of squeezing them.
  ["long-context", "p3", "import numpy as np\ndef rope_angles(pos, d_head, base):\n    i = np.arange(d_head // 2)\n    return pos * base ** (-2 * i / d_head)\ndef interpolate(pos, train_len, target_len):\n    return pos * target_len / train_len"],
  // Applies top-p to the probabilities BEFORE renormalising after top-k (and before the temperature).
  ["recap", "p1", "import numpy as np\ndef final_distribution(z, temperature=1.0, top_k=0, top_p=1.0, min_p=0.0):\n    z = np.asarray(z, dtype=float)\n    p = np.exp(z - z.max()); p /= p.sum()\n    order = np.argsort(-p)\n    keep = np.zeros(len(z), dtype=bool)\n    cum = np.cumsum(p[order])\n    n = int(np.searchsorted(cum, top_p - 1e-12)) + 1\n    keep[order[:min(n, top_k or len(z))]] = True\n    if min_p > 0:\n        keep &= p >= min_p * p.max()\n    q = np.where(keep, np.exp(z / temperature - (z / temperature).max()), 0.0)\n    return q / q.sum()"],
  // Always samples, even at temperature 0 (division by zero aside, it ignores greedy).
  ["recap", "p2", "import numpy as np\ndef sample_next(z, rng, temperature=1.0, top_k=0, top_p=1.0, min_p=0.0):\n    p = final_distribution(z, max(temperature, 1.0), top_k, top_p, min_p)\n    return int(np.searchsorted(np.cumsum(p), rng.random(), side='right'))"],
  // Feeds the newest token at position 0: the classic cache bug.
  ["recap", "p3", "import numpy as np\nrng0 = np.random.default_rng(1)\nV, d = 12, 16\nE = rng0.normal(size=(V, d)); P = rng0.normal(size=(32, d)) * 0.5\nWq, Wk, Wv = (rng0.normal(size=(d, d)) / np.sqrt(d) for _ in range(3))\nWo = rng0.normal(size=(d, V))\ndef forward(new_ids, start, cache):\n    X = E[new_ids] + P[start:start + len(new_ids)]\n    cache['K'].extend(X @ Wk); cache['V'].extend(X @ Wv)\n    K, Vv = np.array(cache['K']), np.array(cache['V'])\n    n, T = len(new_ids), len(cache['K'])\n    S = np.where(np.arange(T)[None, :] <= (T - n + np.arange(n))[:, None], (X @ Wq) @ K.T / np.sqrt(d), -np.inf)\n    A = np.exp(S - S.max(1, keepdims=True)); A /= A.sum(1, keepdims=True)\n    return (X + A @ Vv) @ Wo\ndef generate(prompt, n_new, use_cache, pick):\n    ids, fed = list(prompt), 0\n    cache = {'K': [], 'V': []}\n    for step in range(n_new):\n        if use_cache and step > 0:\n            new, start = ids[-1:], 0\n        else:\n            new, start, cache = ids, 0, {'K': [], 'V': []}\n        fed += len(new)\n        ids.append(pick(forward(new, start, cache)[-1]))\n    return ids[len(prompt):], fed"],
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
