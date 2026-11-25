# Design: Course shell like `example.md` (course overview, progress, syllabus drawer)

Date: 2026-11-25 · Status: draft for approval · Reference: owner's `example.md` (single-file HTML prototype)

## Intent

The owner sees the shell in `example.md` as the ideal: a course page that shows how much of the syllabus is
done, module cards with status, a player whose footer hands you to the next module, and a syllabus you can
open from anywhere. Our app has the content (real tokenizers, real MiniLM, 41 checked steps) but a thinner
shell (a dropdown menu). This change gives our content that shell.

## Goals

- **Course overview page** is the home page: course title and description, completion bar
  ("3 / 14 modules · 21%"), **Resume** button (first unfinished built module), Parts I–IV as sections with
  "n / m modules completed", and module cards (number, title, tagline, tags, steps, minutes, status:
  ✓ Completed / ▶ Up next / "4/9 steps" in progress / Coming soon).
- **Module player**: breadcrumbs (Course / LLM Mastery / 03. Inside LLMs), a clickable segmented step
  progress bar, tabs **Guided Steps** and **Practice Check** (score badge "5/9"), Next becomes
  **Take Practice Check ✓** on the last step, and an **Up next in syllabus** card at the bottom
  ("04. Text Classification →"; "Course complete" after the last module; an unbuilt next module shows
  "coming soon").
- **Syllabus drawer** (☰): all Parts and modules with ✓ / ○, current one highlighted, link back to the
  course overview. Replaces the TopNav dropdown.
- **Header**: brand, breadcrumbs, "Mastered x/14" on the course page.
- **Look**: the example's dark engineering-grid style (slate panels, cyan accent, mono labels).

## Non-goals

- A multi-course catalog (owner: no other syllabus for now). The code keeps one course object so a catalog
  can be added later without rework.
- Free Sandbox tab and Production Engineering Notes (owner: not needed).
- New lesson content, or changing how the right-pane views work (they still change per step).

## Anti-goals

- Replacing real numbers with the example's hard-coded ones.
- Losing anything that works today: real model, keyboard ← → Space, Auto-Play, legacy links and saved
  progress, phone layout, Pages hosting.

## Definitions

- **Module complete** = every step viewed **and** the practice check attempted at least once (both
  already stored in progress: `visitedSteps`, `attempts`).
- **Course completion** = completed modules / all 14 modules in the track (unbuilt ones count in the
  total, so the bar shows true distance through the syllabus).
- **Up next** (course page) = first built module not complete; if all built ones are complete, the first
  unbuilt one is shown as "coming soon".

## Approaches

- **A. Rebuild the shell in our React app (chosen, builder's call).** Keeps tests, real model, content.
- B. Port the example's vanilla HTML: rejected, it would throw away the real model, tests and content.
- C. Restyle only: rejected, it misses the course page and progress the owner asked for.

## Routing

Hash routes: `#/` course overview; `#/<module-id>/<step>` module player; `#/<module-id>/quiz` practice
check. Existing `#/<id>/<step>` links and legacy ids keep working.

## Left to the builder

Exact layout, copy, icons, card tags, colours within the example's style, component split.

## Verification

TDD for progress maths (module status, course %, resume target) and navigation; component tests for the
course page, drawer, tabs and up-next card; `npm run typecheck`, `npm run test`, `npm run build`; a
headless-browser pass over the built site at `/ConceptForge/` including phone width.
