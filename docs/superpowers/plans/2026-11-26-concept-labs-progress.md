# Concept labs + conversational rewrite: progress ledger

Owner request (2026-11-26): every published module and lesson gets one interactive lab per concept, and the
reading is rewritten in a conversational, guided tone (approved sample: Module 01 step 1).
Rules: the right panel follows the reading (ConceptPart.lab → Stage view; IntersectionObserver switches the
panel); real data only (gemma4 recordings, MiniLM vectors, real tokenizers, published configs, or numbers
computed in the page; toy values are labelled as such); worked tables stay script-generated; every lesson keeps
passing the depth validator, exercise checks and browser pass. Branch: `m01-labs` (not merged, not deployed).

Order: Module 01 (12) → Module 02 (14) → Module 03 → 06 → 07 → 08 (03/06/07/08 are still short-format and
need full deep conversion as well).

| Module | Lesson | Text rewritten | Labs per concept | Commit |
|---|---|---|---|---|
| 01 | big-picture | yes | 5/5 (guess-next, loop-lab, temperature, bigram, next-token-tasks) | 7d3c6d6 |
| 01 | anatomy | yes | 6/6 (anatomy, token-lookup, positions, attention, norm-residual, logits) | (this commit) |
| 01 | how-large | yes | 5/5 (neuron, param-calc, scale, data-vs-size, memory) | (this commit) |
| 01 | train-vs-use | yes | 5/5 (loss, gradient, frozen, compute, map) | (this commit) |
| 01 | bag-of-words | yes | 6/6 (bow, cosine, word-order, tfidf, keyword-wins, bridge) | (this commit) |
| 01 | dense-embeddings | yes | 5/5 (dense-vs-sparse, contrastive, neighbours, pooling-loses, embed-vs-llm) | (this commit) |
| 01 | context | yes | 6/6 (bank-matrix, context-mix, context-reach, token-sentence, sense-by-example, map) | (this commit) |
| 01 | architectures | yes | 6/6 (families, arch, objectives, task-framing, family-sizes, model-card) | (this commit) |
| 01 | encoder-decoder | yes | 6/6 (two-stacks, cross-attention, teacher-forcing, encdec-cost, decoder-only, t5-run) | (this commit) |
| 01 | representation-vs-generative | yes | 6/6 (two-outputs, centroid, gen-classify, cost-gap, choose, combine) | (this commit) |
| 01 | pretraining-finetuning | | | |
| 01 | recap | | | |
| 02 | 14 lessons | | | |
| 03, 06, 07, 08 | deep conversion | | | |
