import type { ExercisePart, LocalListing } from "../../../core/types";

/** Every exercise file, as text. One source feeds the page, the tests and the docs. */
const PY = import.meta.glob("./py/**/*.py", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export function pyFile(path: string): string {
  const src = PY[`./py/${path}`];
  if (src === undefined) throw new Error(`Missing exercise file: py/${path}`);
  return src.replace(/\s+$/, "") + "\n";
}

/** Builds an exercise part from `py/<step>/<part>.{starter,solution,checks}.py`. */
export function part(step: string, id: string, prompt: string, hints: string[]): ExercisePart {
  return {
    id,
    prompt,
    hints,
    starter: pyFile(`${step}/${id}.starter.py`),
    solution: pyFile(`${step}/${id}.solution.py`),
    checks: pyFile(`${step}/${id}.checks.py`),
  };
}

const LOCAL = import.meta.glob("./local/*.py", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const CAPTURED = (
  import.meta.glob("./local-outputs.json", { import: "default", eager: true }) as Record<string, Record<string, { output: string; packages: Record<string, string> }>>
)["./local-outputs.json"] ?? {};

/** A "Run it locally" listing: the code in local/<id>.py and the output captured from really running it. */
export function localListing(id: string, title: string, packages: string[]): LocalListing {
  const code = LOCAL[`./local/${id}.py`];
  if (code === undefined) throw new Error(`Missing listing: local/${id}.py`);
  const cap = CAPTURED[id];
  const pins = packages.map((p) => `${p}==${cap?.packages[p] ?? "?"}`).join(" ");
  return { id, title, install: `pip install ${pins}`, code, output: cap?.output ?? "" };
}
