# Design: Deep lessons: Module 01 pilot (understand it, then build it)

Date: 2026-11-25 · Status: approved by owner 2026-11-25 · Applies to: `src/subjects/01-intro-llms/` · Shell: `2026-11-25-course-shell-design.md`

## Intent

The owner asked: "do you think with one paragraph in each step I will come out learning everything?" They wouldn't.
Today every step is a summary, 2–3 short paragraphs and one formula callout. That works as a tour, not as teaching.
The owner wants the site to be **a quick but complete guide to LLMs**. Someone who works through a module should
**come out able to implement what they learnt**. Module 01 is the pilot. Once the owner has worked through it and
approved it, the same pattern goes to every built module (02–06) and to every new one (07–09 and later).

## Amendment (2026-11-26): split layout

The owner tried layout A (one scrolling page) and rejected it: it lost the reading-on-the-left, practical-on-the-right
feel. Deep steps now keep all six sections and all their depth, but split: the reading scrolls on the left (sections 1–6;
"Build it" there is a short card with the exercise title, parts passed and an **Open the exercise** button), and a
practice panel stays in view on the right with two tabs, **Interactive** (the Stage, shown first on every step) and
**Build it · Python** (the exercise and the "Run it locally" listings). The guided task in "The concept" has a **Try it
in the interactive view** button. Both tabs stay mounted, so switching keeps code and results. On phones the panel
sits under the reading and the buttons scroll to it. Moving to another deep step scrolls to the top. Where the text
below says "one scrolling page" or puts the Stage inside "The concept", this amendment wins.

## Goals

- **Every step in Module 01 becomes one scrolling lesson page** (owner chose layout A) with six fixed sections, in this order:
  1. **Why it exists**: the problem this idea solves, with a plain analogy (2–4 short paragraphs).
  2. **Worked example**: one small case done by hand with real numbers, step by step. For example, "the cat sat" →
     token IDs → vectors of shape 3 × 4 → … → probabilities.
  3. **The concept**: full explanation. Any formula is built up one term at a time and each symbol is named. The
     step's existing interactive view sits here, at full width, with a guided "predict → change it → explain" task.
  4. **Build it**: a Python exercise that **runs in the page** (owner chose option A: Pyodide). It has starter code
     with `TODO`s, a **Run** button, checks that say pass or fail, up to two hints, and a **Show solution** button.
     Code that needs PyTorch, Hugging Face, sentence-transformers or Ollama appears as a **"Run it locally"**
     listing with the exact `pip install` line and the output it produces when run.
  5. **Check**: 2–3 questions answered right on the page, with instant feedback and an explanation of why.
  6. **In one sentence**: the summary the learner should be able to say from memory.
- **Module 01 ends with a mini-project**, "Build a tiny language model end to end". It joins the step exercises:
  a bigram model trained on a small text, a tokenizer, generation, and a pre-train → fine-tune shift.
- **Course shell unchanged.** The Practice Check at the end of the module, the course page, the syllabus, progress
  tracking and the up-next card all stay. "Module complete" keeps its current definition. Exercises passed are shown
  but are not required.

## Depth standard (owner: "be detailed where I can learn stuff, not just a paragraph")

A step is deep enough when a reader who has never seen the idea could explain it and rebuild it from the page alone.
Concretely, each step has:

- **Why it exists:** roughly 200–400 words. It covers the problem, what people did before, and why that wasn't enough.
- **Worked example:** every intermediate value written out, with no "…and so on". For example, the actual numbers in a
  3 × 4 matrix, then the actual multiplication, then the actual softmax.
- **The concept:** roughly 800–1,500 words, in titled sub-parts. Every new term is defined where it first appears.
  Every formula is shown with each symbol named and a small numeric case. There is at least one "common mistake" or
  "what people get wrong" note.
- **Build it:** written so the learner implements the core idea themselves. The page gives them the plumbing and the
  learner writes the part that matters.
- **Check:** questions about understanding, not recall. For example, "what happens to X if we double Y, and why?"
- **Go deeper:** 1–3 links to the primary source (paper, model card, official docs) with one line on what each adds.

Coverage is checked against the matching chapters of the owner's reference book, *Hands-On Large Language Models*
(Alammar & Grootendorst), kept git-ignored in `reference/`. It is used as a checklist of topics and depth only; no
text, figures or code are copied.

## Non-goals

- Converting Modules 02–09 now. They follow after the owner approves the pilot.
- A general-purpose code editor or notebook. One exercise per step, plus the mini-project, is enough.
- Running PyTorch or Hugging Face in the browser.

## Anti-goals

- **Depth by word count.** Long text that repeats itself, or filler. Each section must teach something the others
  don't.
- **Output that was never run.** Every "expected output" shown on the page, in-page or "Run it locally", is produced
  by actually running that code. Never written by hand.
- **Exercises that check nothing.** A check that passes on the untouched starter code is a bug.
- **Breaking what works.** Saved progress, links to steps, keyboard ← → (Space now scrolls the page instead of
  starting Auto-Play, see below), phone layout, both themes, GitHub Pages hosting.

## Approaches considered

- **Layout:**
  - **A. One scrolling lesson page per step: chosen by the owner.** Room for depth and code, readable on a phone.
  - B. Keep the split view and add "Deep dive" and "Lab" tabs: rejected, learners skip the tabs.
  - C. Many more small split-view steps: rejected, the column is still too narrow for code.
- **Code:**
  - **A. Python in the page via Pyodide, with copy-and-run-locally listings for heavy libraries: chosen by the owner.**
  - B. Python, all of it run locally: rejected, the learner has to set up Python before trying anything.
  - C. JavaScript in the page: rejected, it is not the language people build LLM systems in.

## Decided by the owner

Layout A, code option A, Module 01 first, and the goal "comes out able to implement it".

## Builder's proposals (adjustable)

**Exercise per step:**

| Step | Build it | Data |
|---|---|---|
| What a language model does | Count bigrams in a short text, then generate greedily: the next-token loop | inline text |
| Anatomy | A NumPy forward pass through a tiny random model: embedding lookup → one attention + FFN block → logits → softmax, printing every shape | random weights, seeded |
| What "large" means | `param_count(config)`; checks against **124,439,808** (GPT-2 small) and **8,030,261,248** (Llama 3 8B); memory per data type | the published configurations in `modelConfigs.ts` |
| Training vs using | 6·N·D and 2·N per token for Llama 3 8B; then one gradient step on a 2-weight model, showing that training changes the weights and inference does not | numbers from the sources |
| Bag-of-Words | Vocabulary + count vectors by hand + cosine similarity | the step's own sentences |
| Dense embeddings | Cosine similarity and nearest neighbour on real MiniLM vectors. "Run it locally": the same with sentence-transformers | precomputed vectors from the existing fixtures |
| Context changes meaning | Compare the vectors for "bank" in two sentences. "Run it locally": Hugging Face `transformers` hidden states | precomputed contextual vectors (new fixture, from a real model) |
| Three families | Build a causal mask and a bidirectional mask; apply them to a score matrix | NumPy |
| Encoder-decoder | Cross-attention shapes. "Run it locally": a small T5 translation | NumPy |
| Representation vs generative | Nearest-centroid classifier on real vectors. "Run it locally": embed with sentence-transformers and generate with Ollama over `/api/generate` | existing fixtures |
| Pre-training → fine-tuning | Bigram counts on general text, then extra counts on banking text; the next-token probabilities shift | inline text |
| Recap | Mini-project (above) | — |

The owner's approval of this document covers the table above. Content work can start without a second checkpoint.
The owner reviews the result when they work through the finished module.

**Other choices:**

- **Recap step (builder's call):** keeps all six sections. Its "Build it" is the mini-project: one exercise in several
  parts (a tokenizer, bigram training, generation, fine-tuning), each with its own check. The exercise format therefore
  supports **one or more parts per exercise**, each with its own starter code and checks.
- **Where "exercises passed" shows (builder's call):** only on the lesson page (each step's "Build it" section shows
  passed or not yet) and on the module's step bar as a small mark. The course page, syllabus drawer and module
  completion maths stay untouched.
- **While the cursor is in the code box,** ← → move the cursor, not the step.

- **Pyodide:** pinned exact version, at least two weeks old, loaded only on the first press of Run. The default is
  the official jsDelivr CDN; the builder may self-host instead if the Pages size budget allows. A status line says
  "Loading Python (≈10 MB, first time only)". NumPy is loaded only for exercises that import it. The code runs in a
  Web Worker so the page never freezes, and a timeout stops infinite loops.
- **Precomputed data reaches Python** by being written into the Python environment as JSON before the learner's code
  runs.
- **Exercise progress** (passed / not yet) is stored next to the existing per-module progress, under its own key.
  The learner's edited code is kept per step as a local convenience.
- **Auto-Play** no longer fits a page that scrolls, so it is turned off for deep steps. ← → still change steps.
  Space scrolls the page as a browser normally does.
- **Data shape:** a step gains optional deep sections. Steps without them render exactly as they do today, so
  Modules 02–06 keep working untouched until they are converted.

## Constraints

- Existing stack: React 19, TS strict, Tailwind with the cream and dark themes, Vitest, TDD. Static, free, no server,
  no API key.
- Every fact checked against primary sources, added to `docs/research/part1-sources.md`.
- Reading level: plain English. Every term is defined the first time it is used. Code is short, about 30 lines or
  fewer per exercise.

## Verification

- **TDD** for the exercise runner (pass/fail checks, timeout, error display) and for the progress store.
- **Every exercise's solution is run in tests and must pass its checks; its starter code must fail them.** The
  builder picks the test mechanism (for example the `pyodide` npm package under Node).
- **Every "Run it locally" output is captured** from a real run by a script whose output is committed.
- Smoke test over every Module 01 step. Headless-browser pass in both themes and at phone width, including a real
  Pyodide run.
- Typecheck, tests, build, size check.
- **The owner works through Module 01 and approves it before the pattern goes to other modules.**

## Left to the builder

Exact wording, analogies, worked-example numbers, question wording, component split, how a deep step is styled,
hint text, the mini-project's exact shape.
