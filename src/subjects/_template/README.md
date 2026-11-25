# Subject template

Starter for a new ConceptForge subject. Don't edit this folder for a real subject; scaffold a copy:

```bash
node scripts/create-subject.mjs <subject-id> "<Subject Title>"            # copy only, prints registration lines
node scripts/create-subject.mjs <subject-id> "<Subject Title>" --register # copy and add it to src/core/registry.ts
```

| File | What goes in it |
| --- | --- |
| `index.ts` | The `SubjectModule`: id, titles, icon, accent, and wiring of the files below |
| `steps.ts` | Ordered `LessonStep[]`; each step's `view` tells the Stage what to draw |
| `challenges.ts` | `ChallengeItem[]` quiz questions; link each to a step with `relatedStepId` |
| `model.ts` | Pure, unit-testable logic behind the visuals (no React) |
| `Stage.tsx` | The interactive visual. Control state lives here so it survives step changes |
