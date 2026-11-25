import tokensEmbeddings from "../subjects/02-tokens-embeddings";
import s01IntroLlms from "../subjects/01-intro-llms";
import s03TransformerInternals from "../subjects/03-transformer-internals";
import textClassification from "../subjects/04-text-classification";
import clusteringTopics from "../subjects/05-clustering-topics";
import promptEngineering from "../subjects/06-prompt-engineering";
// @register-import — add new subject imports above this line
import type { SubjectModule } from "./types";

/**
 * Every module the platform ships. To add one: `node scripts/create-subject.mjs <id> "<Title>" --register`.
 */
const REGISTERED: SubjectModule[] = [
  tokensEmbeddings,
  s01IntroLlms,
  s03TransformerInternals,
  textClassification,
  clusteringTopics,
  promptEngineering,
  // @register-subject — add new subjects above this line
];

/** Registered modules in curriculum order (by module number). */
export const SUBJECTS: readonly SubjectModule[] = [...REGISTERED].sort((a, b) => a.moduleNumber - b.moduleNumber);

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Returns human-readable problems with a subject definition (empty array = valid). */
export function validateSubject(subject: SubjectModule): string[] {
  const problems: string[] = [];
  if (!ID_PATTERN.test(subject.id)) problems.push(`id "${subject.id}" must be kebab-case`);
  if (subject.steps.length === 0) problems.push("needs at least one step");
  if (subject.category.trim() === "") problems.push("category must not be empty");
  if (!(subject.estimatedMinutes > 0)) problems.push("estimatedMinutes must be positive");

  const stepIds = new Set<string>();
  for (const step of subject.steps) {
    if (stepIds.has(step.id)) problems.push(`duplicate step id "${step.id}"`);
    stepIds.add(step.id);
    if (step.body.length === 0) problems.push(`step "${step.id}" has no body`);
  }

  const challengeIds = new Set<string>();
  for (const c of subject.challenges) {
    if (challengeIds.has(c.id)) problems.push(`duplicate challenge id "${c.id}"`);
    challengeIds.add(c.id);
    if (c.options.length < 2) problems.push(`challenge "${c.id}" needs 2+ options`);
    if (!Number.isInteger(c.correctIndex) || c.correctIndex < 0 || c.correctIndex >= c.options.length) {
      problems.push(`challenge "${c.id}" correctIndex out of range`);
    }
    if (c.relatedStepId && !stepIds.has(c.relatedStepId)) {
      problems.push(`challenge "${c.id}" links unknown step "${c.relatedStepId}"`);
    }
  }
  return problems;
}

export interface SubjectGroup {
  category: string;
  subjects: SubjectModule[];
}

/** Subjects grouped by curriculum stage, in registration order. */
export function groupByCategory(subjects: readonly SubjectModule[]): SubjectGroup[] {
  const groups: SubjectGroup[] = [];
  for (const s of subjects) {
    const g = groups.find((x) => x.category === s.category);
    if (g) g.subjects.push(s);
    else groups.push({ category: s.category, subjects: [s] });
  }
  return groups;
}

export function listSubjects(): readonly SubjectModule[] {
  return SUBJECTS;
}

export function getSubject(id: string | null | undefined): SubjectModule | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

export function defaultSubject(): SubjectModule {
  const first = SUBJECTS[0];
  if (!first) throw new Error("No subjects registered");
  return first;
}
