# Design: LLM Mastery Part II (Modules 04–09) + Module 01 "anatomy" steps

Date: 2026-11-25 · Status: draft for approval · Curriculum: `docs/curriculum.md` · Shell: `2026-11-25-course-shell-design.md`

## Intent

The owner is learning LLMs end to end and wants every piece to connect to the whole. Part I explained how an
LLM works inside; Part II shows how pretrained models are **used**: classifying, clustering, prompting,
agents, retrieval (RAG) and images. Each module keeps the track's rule: real numbers, or clearly labelled.

The owner also noticed the intro (Module 01) never shows **what an LLM is made of** as one picture; that is
added first.

## Goals

- **Module 01 additions** (3 steps, early in the module, before the family comparison):
  1. *Anatomy of an LLM*: clickable diagram tokenizer → embedding table → N × transformer block (attention +
     feed-forward) → output head → next-token probabilities; each part links to the module that covers it.
  2. *What "large" means*: parameters/weights in plain words; real published configs side by side (e.g.
     GPT-2 small, Llama 3 8B: layers, hidden size, vocabulary, context window, training tokens) and where the
     parameters live (embedding table vs layers) computed from the config; slider across model sizes.
  3. *Training vs using*: learning weights once (expensive) vs inference per token (cheap) → bridges to
     Parts III and IV.
  Figures checked against model papers / official model cards (`docs/research/`). They ship in release 1
  without waiting: the owner said to keep moving and will give feedback after seeing them.
- **Modules 04–09** fully built in the course shell: steps with narrative and formula callouts, a live
  visualizer per step, practice check (4+ questions per module), bridges (builds on / up next), research
  notes with sources.
- Two releases: **R1 = Module 01 additions + 04, 05, 06**; **R2 = 07, 08, 09**; each verified (typecheck,
  tests, build, browser pass) and pushed to Pages.

## Non-goals

- Running a generative LLM in the browser (owner chose option A).
- Training real neural networks in the browser beyond small classifiers on MiniLM vectors.
- Parts III–IV.

## Anti-goals

- Generated text presented as real when it isn't. Every generated output is either **recorded from a real
  model** (labelled with the model name, e.g. "recorded from gemma4:12b, temperature 0") or produced live.
- A site that costs visitors money or needs an API key or server.

## Generated text: option A (owner's choice)

- **Recording:** a script (`scripts/record-generations.mjs`) sends every example prompt to the owner's local
  Ollama (`gemma4:12b`; `qwen2.5vl:7b` for images) and saves the full outputs, model name, options and date as
  JSON fixtures in the repo. Re-runnable. Outputs are shown verbatim.
- **Live switch (builder's call):** a small "Connect my Ollama" button on generative steps, on every build
  including Pages. The site **never contacts Ollama until the learner clicks it** (no background probing, so
  visitors get no local-network permission prompts). On click it tries the endpoint (default
  `http://localhost:11434`, editable); on failure it explains `OLLAMA_ORIGINS` / the browser's local-network
  prompt and stays on recordings. Live mode covers every generative panel: free-text prompts (04, 06), memory
  summaries (07), the ReAct agent (tools run in the browser, 07), RAG answers (08) and image Q&A with
  `qwen2.5vl:7b` (09).
- **Unrecorded states (builder's call):** generative panels use fixed example inputs, and sliders that feed a
  generative panel snap to recorded values (e.g. chunk sizes 128 / 256 / 512). Non-generative parts (search,
  metrics, clustering, classifiers) stay fully free and live. If a state has no recording (e.g. a document
  the learner added), the panel says "No recording for this setting" and offers live mode; never the nearest
  recording passed off as this one.
- **Confidence and probabilities (verified on the owner's Ollama 0.40.18):** Ollama returns token
  log-probabilities (`logprobs`, `top_logprobs`) for gemma4. Recordings store them. Module 04's generative
  confidence = probability of the chosen label's first token; Module 06 gets the curriculum's **Probability
  Inspector** (top alternatives per output token). Recordings use `think: false` so the model's hidden
  reasoning channel does not swallow the token budget.
- **Tool calling (verified):** gemma4:12b returns native Ollama `tool_calls` (tested with a calculator tool).
  The ReAct recording uses native tool calling; our code runs the tools. Every recorded run is kept and
  shown, including failed or wrong ones (no cherry-picking); if a run fails, that is part of the lesson.

## Module designs

Fixed by this design: live in-browser classifier training (04), `min_cluster_size` + outlier sliders (05),
the recorded 16-combination experiment (06), the real cross-encoder reranker (08), offline real CLIP (09).
Everything else in this section is the builder's proposal and may be adjusted.

**04 Text Classification** (`04-text-classification`). Dataset: ~60 short banking support tickets / reviews
with labels (e.g. card issue, transfer, fraud, account, loan), written for the site and split train/test.
- *Embedding + classifier head*: MiniLM vectors → logistic regression trained **live in the browser**
  (real training, loss curve, test accuracy, confusion matrix).
- *Zero-shot*: cosine similarity between ticket vectors and label-description vectors (real), with
  editable label descriptions.
- *Generative*: classification prompt recorded from gemma4 per test ticket (real answers + recorded latency).
- *3-way comparator*: pick a ticket → three verdicts with confidence, latency and a cost estimate (cost
  model labelled as an estimate with its assumptions).

**05 Clustering & Topics** (`05-clustering-topics`). ~80 short documents across a few themes. Real pipeline in
the browser: MiniLM embeddings → UMAP (JS implementation) to 2-D → HDBSCAN (our implementation, unit-tested)
with **min_cluster_size** and an outlier threshold slider → c-TF-IDF top words per cluster (real). Topic names
recorded from gemma4 for the default clustering (labelled). Precomputed embeddings so the page is fast;
live recompute when the learner adds a document.

**06 Prompt Engineering** (`06-prompt-engineering`). A real experiment recorded from gemma4: one task (e.g.
extract fields from a ticket into JSON) × 16 prompt combinations (Role, Few-shot, Chain-of-Thought, JSON
schema on/off) × a small labelled test set × several samples at temperature > 0. The builder shows, per
combination, real accuracy and real output variance (how often answers differ), plus the full prompt and
outputs. Structured outputs via Ollama's JSON-schema `format`. Prompt chaining shown as a recorded 2-step
chain. Token counts of each prompt with the real o200k tokenizer.

**07 Agents & Tools** (`07-agents-tools`).
- *Quantization*: exact memory maths (FP16/INT8/INT4 × parameter count) and a real demo quantizing a vector
  and measuring the error.
- *Memory*: a scripted multi-turn conversation; Full buffer / Sliding window / Summary memory with real token
  counts (o200k) against a budget slider; summaries recorded from gemma4.
- *ReAct*: a real tool-calling trace recorded from gemma4 (Ollama tool calling) with tools our code actually
  executed (calculator, a small FX-rate table, a ticket lookup); stepper Thought → Tool call → Observation →
  Final answer.

**08 Semantic Search & RAG** (`08-semantic-search-rag`). Corpus: ~10 short policy-style documents written for
the site. Real chunking (size slider, overlap), real BM25 and MiniLM dense search, hybrid fusion (reciprocal
rank), **real cross-encoder reranker** in the browser (`Xenova/ms-marco-MiniLM-L-6-v2`, quantized ≈ 23 MB,
self-hosted, lazy) and real Recall@K / MRR / NDCG against labelled relevant chunks. Grounded answers with
citations recorded from gemma4 for each distinct retrieved context the controls can produce (chunk sizes ×
hybrid × rerank), plus a faithfulness check (which answer sentences are supported by which chunk).

**09 Multimodal** (`09-multimodal-llms`). A few sample images (owner-free licence, e.g. own drawings or public
domain). Patch grid tokenization (real slicing, counts for real ViT configs). CLIP similarity between
whole images and captions **precomputed offline with real CLIP** (`clip-vit-base-patch32`) and stored as
fixtures. CLIP only aligns the whole-image vector with text, so for hovering a patch the builder embeds that
patch **cropped as its own small image** and labels it that way (it is not the patch token itself); typing a new caption uses the CLIP text encoder live if it fits the size budget (builder decides;
else fixed caption list). Projection into the LLM: diagram of the LLaVA path with real token counts; image
question-answers recorded from `qwen2.5vl:7b` (a LLaVA-style model).

## Constraints

- Free and static on GitHub Pages: site ≤ 1 GB, no file > 100 MB in git, lazy-load heavy assets per step.
- Existing stack and conventions (React 19, TS strict, Tailwind, Vitest, TDD), course shell, MiniLM engine.
- Every fact checked against primary sources, listed in `docs/research/part2-sources.md`.
- Recording needs the owner's Ollama running; the builder records, the fixtures are committed.

## Approaches (generation)

- **A. Real outputs recorded from local gemma4 + optional live Ollama switch — chosen by owner.**
- B. Small model in the browser (300–500 MB per visitor, slow on phones, weak answers, too big for git).
- C. Hand-written illustrative outputs (not real; against the track's rule).

## Left to the builder

Example texts and datasets, exact step lists (~8–12 per module), visual layouts, question wording, which
real model configs to show, sampling counts in Module 06, whether the CLIP text encoder ships live.

## Verification

TDD for all pure logic (logistic regression, HDBSCAN, c-TF-IDF, BM25, RRF, metrics, chunking, token-budget
memory, quantization error); fixture-shape tests for recordings; smoke test over every step and quiz;
headless-browser pass on the `/ConceptForge/` build; size check of `dist/`. Each release: typecheck, test,
build, push.
