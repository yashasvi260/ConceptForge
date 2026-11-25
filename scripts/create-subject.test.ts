import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");
const SCRIPT = join(ROOT, "scripts", "create-subject.mjs");

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "cf-subject-"));
  mkdirSync(join(dir, "src", "core"), { recursive: true });
  cpSync(join(ROOT, "src", "subjects", "_template"), join(dir, "src", "subjects", "_template"), { recursive: true });
  writeFileSync(join(dir, "src", "core", "registry.ts"), readFileSync(join(ROOT, "src", "core", "registry.ts"), "utf8"));
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

const run = (...args: string[]) =>
  spawnSync(process.execPath, [SCRIPT, ...args], { env: { ...process.env, CONCEPTFORGE_ROOT: dir }, encoding: "utf8" });

describe("create-subject script", () => {
  it("copies the template with the new id and titles", () => {
    const out = execFileSync(process.execPath, [SCRIPT, "linear-algebra", "Linear Algebra", "--short", "Lin Alg"], {
      env: { ...process.env, CONCEPTFORGE_ROOT: dir },
      encoding: "utf8",
    });
    expect(out).toContain('import linearAlgebra from "../subjects/linear-algebra";');
    const index = readFileSync(join(dir, "src", "subjects", "linear-algebra", "index.ts"), "utf8");
    expect(index).toContain('id: "linear-algebra"');
    expect(index).toContain('title: "Linear Algebra"');
    expect(index).toContain('shortTitle: "Lin Alg"');
    expect(index).toMatch(/category: "[^"]+"/);
    expect(index).toMatch(/difficulty: "(beginner|intermediate|advanced)"/);
    expect(index).toMatch(/estimatedMinutes: \d+/);
    expect(() => readFileSync(join(dir, "src", "subjects", "linear-algebra", "README.md"))).toThrow();
  });

  it("registers the subject when asked", () => {
    expect(run("graph-theory", "Graph Theory", "--register").status).toBe(0);
    const registry = readFileSync(join(dir, "src", "core", "registry.ts"), "utf8");
    expect(registry).toContain('import graphTheory from "../subjects/graph-theory";\n// @register-import');
    expect(registry).toContain("  graphTheory,\n  // @register-subject");
  });

  it("rejects bad ids, missing args and existing folders", () => {
    expect(run("Bad_Id", "X").status).toBe(1);
    expect(run("only-id").status).toBe(1);
    expect(run("my-subject", "X").status).toBe(1);
    expect(run("dupe", "Dupe").status).toBe(0);
    const again = run("dupe", "Dupe");
    expect(again.status).toBe(1);
    expect(again.stderr).toContain("already exists");
  });
});
