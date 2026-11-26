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
| 01 | bag-of-words | | | |
| 01 | dense-embeddings | | | |
| 01 | context | | | |
| 01 | architectures | | | |
| 01 | encoder-decoder | | | |
| 01 | representation-vs-generative | | | |
| 01 | pretraining-finetuning | | | |
| 01 | recap | | | |
| 02 | 14 lessons | | | |
| 03, 06, 07, 08 | deep conversion | | | |
