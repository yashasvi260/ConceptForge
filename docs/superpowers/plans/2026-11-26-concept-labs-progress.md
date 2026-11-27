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
| 01 | pretraining-finetuning | yes | 6/6 (training, finetune-format, transfer, forgetting, data-per-stage, base-to-assistant) | (this commit) |
| 01 | recap | yes | 6/6 (recap-tokenize, smoothing, recap-generate, perplexity, vs-real, map) | (this commit) |
| 01 | (all) | Module 01 complete: 68 labs, browser pass 75 views 0 problems; Stage lazy (main bundle 203 KB gz) | | cfe6056 |
| 02 | why-numbers | yes | 4/4 (intro, oov, seq-length, chop) | (this commit) |
| 02 | vocabulary | yes | 4/4 (vocab, vocab-cost, vocab-buys, add-tokens) | (this commit) |
| 02 | bpe-training | yes | 4/4 (bpe-train, bpe-compress, pretokenize, merges-curve) | (this commit) |
| 02 | bpe-encoding | yes | 4/4 (bpe-encode, merge-order, fertility, variants) | (this commit) |
| 02 | bytes | yes | 4/4 (bytes, byte-tax, byte-standins, stream-decode) | (this commit) |
| 02 | wordpiece | yes | 4/4 (wordpiece, wp-unk, wp-score, wp-fertility) | (this commit) |
| 02 | sentencepiece | yes | 4/4 (sp-normalize, unigram, viterbi-table, unigram-prune) | (this commit) |
| 02 | special-tokens | yes | 4/4 (special-ids, chat-template, special, padding-mask) | (this commit) |
| 02 | playground | yes | 4/4 (languages, pretokenize, number-chunks, playground) | b755dd9 |
| 02 | quirks | yes | 4/4 (quirks, glitch, practice, chunker) | b755dd9 |
| 02 | lookup-table | yes | 4/4 (lookup, sparse-grad, contrastive [M01], table-memory) | (this commit) |
| 02 | static-vs-contextual | yes | 4/4 (static-contextual, bank-shift, cos-baseline, sense-by-example [M01]) | (this commit) |
| 02 | sentence-embeddings | yes | 4/4 (sentence-emb, pool-mask, similarity, score-traps) | (this commit) |
| 02 | cheat-sheet | yes | 5/5 (pipeline-trace, search-preview, index-cost, retrieval-eval, hybrid) | (this commit) |
| 03, 06, 07, 08 | deep conversion | | | |

## Module 02 lab plan (concept → view)

Existing views reused: intro, chop, vocab, bpe-train, bpe-encode, bytes, wordpiece, unigram, special, playground,
languages, quirks, practice, lookup, static-contextual, bank-shift, sentence-emb, similarity, search-preview.
New labs (Module 02 Stage, lazy): oov, seq-length, vocab-cost, vocab-buys, add-tokens, bpe-compress, pretokenize,
merges-curve, merge-order, fertility, variants, byte-tax, byte-standins, stream-decode, wp-unk, wp-score,
wp-fertility, sp-normalize, viterbi-table, unigram-prune, special-ids, chat-template, padding-mask, number-chunks,
glitch, chunker, sparse-grad, table-memory, cos-baseline, pool-mask, score-traps, pipeline-trace, index-cost,
retrieval-eval, hybrid. Reused from Module 01: contrastive (row meaning), sense-by-example.

Module 02 browser pass (MOD=02-tokens-embeddings STEPS=14, 1280 + 390): 58 lab views, 0 problems.
New real recording: scripts/record-m02-embedding-labs.mjs → data/embedding-labs.json (padded batch, score traps, error-code hybrid set).

## Module 03 deep conversion (split from Module 04 in 8980c16)

Plan: 10 deep lessons — forward-pass, positional, qkv, self-attention, multi-head, gqa, residual-norm, ffn,
moe (new, curriculum v2), recap (mini-project: one transformer block in NumPy).
Real data: scripts/record-m03-gpt2.mjs → data/gpt2.json (GPT-2 small, transformers 5.22.2 / torch 2.15.0 CPU):
attention for 3 sentences (12 layers × 12 heads), per-head previous/first/self averages over 8 sentences,
residual-stream norms, LayerNorm before/after, learned-position similarity, GELU activity.
Findings to use: L4H11 previous-token head 0.997; median head puts 0.664 on the first token (attention sink);
first-token norm grows 10 → ~3,100; position neighbours 0.997, distance 256 → −0.446; ~10% FFN units > 0.1.

| module | lesson | deep | labs | commit |
| --- | --- | --- | --- | --- |
| 03 | forward-pass | yes | 3/3 (forward, shapes, block-params) | 0292a7d |
| 03 | positional | yes | 4/4 (shuffle, positional, learned-pos, rope-relative) | 0292a7d |
| 03 | qkv | yes | 4/4 (qkv-project, qkv, sqrt-d, value-mix) | f3265e7 |
| 03 | self-attention | yes | 4/4 (real-heads, attention, head-finder, attn-cost) | f3265e7 |
| 03 | multi-head | yes | 4/4 (multihead, head-split, head-grid, head-ablation) | 6b8d69d |
| 03 | gqa | yes | 4/4 (gqa, kv-sharing, kv-budget, kv-repeat) | 6b8d69d |
| 03 | residual-norm | yes | 4/4 (stream-norms, residual-depth, norm, pre-post) | 6b5870b |
| 03 | ffn | yes | 4/4 (ffn-shapes, ffn, ffn-active, swiglu-params) | 6b5870b |
| 03 | moe | yes | 4/4 (moe-params, moe-router, moe-balance, moe-memory) | 98b4fab |
| 03 | recap | yes | 4/4 (block-trace, weight-names, block-check, recap) | (this commit) |

Head ablation added to gpt2.json: base loss 4.0468 over 8 sentences; 78/144 heads < +0.01, 129 < +0.05, 8 > +0.1; most important L0H10 +0.486; L4H11 +0.005.
Validator now rejects repeated column names in worked tables (React keys; caught by the smoke test in lesson 5).

MoE (new step 9): counts from Mixtral 8x7B config reproduce 46,702,792,704 total / 12,879,925,248 active; router scores and batches are labelled made-up.
Redirect narrowed: Module 03 now has 10 steps, so only old /11 (KV cache) redirects to Module 04 (old /10 would have hijacked the new recap).

Module 03 complete: 10 deep lessons, 39 lab views, browser pass (1280 + 390) 0 problems. Recap listing gpt2-block captured (torch 2.15.0, transformers 5.22.2): NumPy vs HF 2.4e-5 after block 1, 4.5e-5 after the stack (recorder, eager attention: 3.9e-5).

## Module 04 deep conversion (How LLMs Generate)

Plan: 7 deep lessons — logits, decoding (greedy, temperature, beam), truncation (top-k, top-p, min-p, order),
generation-loop (stop rules, prefill vs decode), kv-cache, long-context, recap (mini-project: a sampler and a
generation loop with a KV cache that matches the loop without one).
Real data: scripts/record-m04-generation.mjs → data/generation.json (GPT-2 small, transformers 5.22.2 / torch 2.15.0
CPU, 4 threads): full-vocabulary next-token stats for 4 prompts at 20 temperatures (exact log-sum-exp per T), top-40
logits, the LM head on one real vector (tied to wte), per-position predictions, greedy / beam / 18 seeded samples
with each token's rank, a manual loop with and without the cache, timings, loss by context length on Pride and
Prejudice (Gutenberg mirror), and the 1,025-token IndexError.
Findings to use: greedy loops on "I'm sorry." (cat prompt); beam −42.6 vs greedy −49.5 log-prob; pure sampling at
T=1 picks tokens ranked up to 10,730 (4–6 of 30 outside the top 100), top-k 40 / top-p 0.9 keep max rank 36–612;
nucleus 0.9 = 1,503 tokens for "The capital of France is" vs 77 for "My favourite thing about weekends is"; GPT-2
ranks " Paris" 5th (3.2%); cache vs no cache: same 20 tokens, max logit diff 6.7e-4; at 512 tokens of context one
decode step takes 25.7 ms with the cache and 479 ms without (64 tokens: 1.7 s vs 30.7 s); prefill 64 → 1,024 tokens:
63 → 1,330 ms (512: 439 ms); repetition_penalty 1.2 breaks the greedy loop but bends grammar (log-prob −93.7),
no_repeat_ngram_size 3 escapes it at −60.4;
loss falls from 5.18 (2–4 tokens of context) to 3.48 (257–1,023). Sampler order verified in transformers 5.22.2
generation/utils.py: repetition penalty → temperature → top-k → top-p → min-p.

| module | lesson | deep | labs | commit |
| --- | --- | --- | --- | --- |
| 04 | logits | yes | 4/4 (lm-head, softmax-shift, real-next, every-position) | 2e4e118 |
| 04 | decoding | yes | 4/4 (greedy-loop, temperature, temp-samples, beam) | 2e4e118 |
| 04 | truncation | yes | 4/4 (tail-mass, topk-fixed, nucleus, sampler-chain) | (this commit) |
| 04 | generation-loop | yes | 4/4 (loop-steps, stop-rules, prefill-decode, repetition) | (this commit) |

Steps 1–4 browser pass (1280 + 390): 16 lab views, 0 problems. Interim: kv-cache and recap are still short-format;
old #/03-transformer-internals/11 now lands on kv-cache at index 4. The illustrative SamplingView is gone (NEXT and
applySampling stay for Module 01's map). Ollama defaults quoted from its Modelfile docs (temperature 0.8, top_k 40,
top_p 0.9, min_p 0.0, repeat_penalty 1.0, num_predict −1); HF repetition penalty checked in logits_process.py
(once per token, prompt included, negative × penalty / positive ÷ penalty).
