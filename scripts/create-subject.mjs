#!/usr/bin/env node
// Scaffold a new ConceptForge subject from src/subjects/_template.
//
//   node scripts/create-subject.mjs <subject-id> "<Subject Title>" [--short "<Nav label>"] [--register]
//
// Without --register it prints the two lines to add to src/core/registry.ts.
// CONCEPTFORGE_ROOT overrides the project root (used by the script's own test).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEMPLATE_ID = "my-subject";
const TEMPLATE_TITLE = "My Subject";

function fail(message) {
  console.error(`create-subject: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  let short = null;
  let register = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--register") register = true;
    else if (arg === "--short") short = argv[++i] ?? fail("--short needs a value");
    else if (arg === "--help" || arg === "-h") {
      console.log('Usage: node scripts/create-subject.mjs <subject-id> "<Subject Title>" [--short "<label>"] [--register]');
      process.exit(0);
    } else if (arg.startsWith("--")) fail(`unknown option ${arg}`);
    else positional.push(arg);
  }
  return { id: positional[0], title: positional[1], short, register };
}

function toIdentifier(id) {
  return id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[0-9]/, (d) => `s${d}`);
}

const { id, title, short, register } = parseArgs(process.argv.slice(2));
if (!id || !title) fail('usage: node scripts/create-subject.mjs <subject-id> "<Subject Title>"');
if (!ID_PATTERN.test(id)) fail(`subject id "${id}" must be kebab-case (e.g. "linear-algebra")`);
if (id === TEMPLATE_ID) fail(`"${TEMPLATE_ID}" is the template's placeholder id; pick another`);

const root = process.env.CONCEPTFORGE_ROOT
  ? resolve(process.env.CONCEPTFORGE_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const subjectsDir = join(root, "src", "subjects");
const templateDir = join(subjectsDir, "_template");
const targetDir = join(subjectsDir, id);

if (!existsSync(templateDir)) fail(`template not found at ${templateDir}`);
if (existsSync(targetDir)) fail(`src/subjects/${id} already exists`);

const shortTitle = short ?? title;
mkdirSync(targetDir, { recursive: true });
for (const file of readdirSync(templateDir)) {
  if (file === "README.md") continue;
  const src = readFileSync(join(templateDir, file), "utf8");
  const out = src
    .replaceAll(`id: "${TEMPLATE_ID}"`, `id: ${JSON.stringify(id)}`)
    .replaceAll(`shortTitle: "${TEMPLATE_TITLE}"`, `shortTitle: ${JSON.stringify(shortTitle)}`)
    .replaceAll(`title: "${TEMPLATE_TITLE}"`, `title: ${JSON.stringify(title)}`);
  writeFileSync(join(targetDir, file), out);
}

const ident = toIdentifier(id);
const importLine = `import ${ident} from "../subjects/${id}";`;
const listLine = `  ${ident},`;
console.log(`Created src/subjects/${id}/`);

if (register) {
  const registryPath = join(root, "src", "core", "registry.ts");
  let registry = readFileSync(registryPath, "utf8");
  const importMarker = "// @register-import";
  const listMarker = "  // @register-subject";
  if (!registry.includes(importMarker) || !registry.includes(listMarker)) {
    fail("registry.ts is missing the @register markers; add the lines below by hand:\n" + importLine + "\n" + listLine);
  }
  registry = registry.replace(importMarker, `${importLine}\n${importMarker}`);
  registry = registry.replace(listMarker, `${listLine}\n${listMarker}`);
  writeFileSync(registryPath, registry);
  console.log("Registered it in src/core/registry.ts.");
} else {
  console.log("\nTo register it, add to src/core/registry.ts:\n");
  console.log(`  ${importLine}`);
  console.log(`  …and in SUBJECTS:  ${listLine.trim()}`);
  console.log("\n(or re-run with --register next time)");
}
console.log(`Then edit steps.ts, challenges.ts, model.ts and Stage.tsx in src/subjects/${id}/.`);
