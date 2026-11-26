import type { ExercisePart } from "../../../core/types";

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
