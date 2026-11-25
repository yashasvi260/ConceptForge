# Part II sources (and Module 01 additions)

Every number shown in these modules is computed by the site's own code, recorded from a real model
(labelled), or taken from the sources below. Checked 2026-11-25.

## Module 01 · anatomy, scale, training vs using

- **GPT-2 small config**: `n_embd 768`, `n_layer 12`, `n_head 12`, `n_positions 1024`, `vocab_size 50257`,
  tied input/output embeddings: https://huggingface.co/openai-community/gpt2/blob/main/config.json.
  Parameter count computed by `paramBreakdown` = 124,439,808 (matches the Hugging Face model total).
- **Llama 3 8B**: model card (https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md): 128K-token
  vocabulary, trained on sequences of 8,192 tokens, GQA, 15T+ pre-training tokens, 1.3M H100 GPU hours for 8B.
  Shape from the reference implementation (https://github.com/meta-llama/llama3/blob/main/llama/model.py):
  dim 4096, 32 layers, 32 heads, SwiGLU hidden size rule (`ffn_dim_multiplier` 1.3, `multiple_of` 1024 →
  14,336), 8 KV heads; vocab 128,256 (128,000 + 256 special tokens); untied output head.
  `paramBreakdown` = 8,030,261,248 (the published 8.03B).
- **GPT-3 175B**: Brown et al. 2020, Table 2.1 (https://arxiv.org/abs/2005.14165): 96 layers, d_model 12,288,
  96 heads, context 2,048, 300B training tokens. `paramBreakdown` ≈ 174.6B (the paper's 175B).
- **Compute estimates**: training ≈ 6·N·D FLOPs and inference ≈ 2·N FLOPs per token, Kaplan et al. 2020
  "Scaling Laws for Neural Language Models" (https://arxiv.org/abs/2001.08361), §2.1.

## Module 04 · text classification

- **Tickets**: 60 short banking support messages written for this lesson (5 labels × 12; 8 train / 4 test each).
- **MiniLM size**: all-MiniLM-L6-v2 (https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) is a 6-layer,
  384-wide BERT (vocab 30,522, FFN 1,536): 22,713,216 weights from its config, the published "22.7M".
- **Head**: 5 × 384 + 5 = 1,925 weights, softmax regression, full-batch gradient descent from zero (our code).
  Measured: 20/20 held-out tickets with the default settings (epochs 200, lr 2).
- **Zero-shot**: cosine to label descriptions (our code, live MiniLM). Measured with the default descriptions:
  17/20 (misses: three transfer tickets).
- **Generative**: gemma4:12b via Ollama 0.40.18, temperature 0, `think: false`, recorded 2026-11-25 with
  `logprobs`/`top_logprobs: 5`; 20/20 correct. Latency is what the recording took on the owner's local GPU.
  Token counts (`prompt_eval_count` + `eval_count`) are gemma4's own.

## Module 05 · clustering and topics

- **Comments**: 78 short bank-customer comments written for this lesson (6 themes × 12–13, plus 5 off-topic).
- **UMAP**: McInnes, Healy & Melville 2018 (https://arxiv.org/abs/1802.03426), via `umap-js` 1.4.0 (MIT,
  https://github.com/PAIR-code/umap-js) with a seeded random source. Defaults chosen by measurement:
  n_neighbors 12, min_dist 0.1, seed 42. The default layout is precomputed (data/default-layout.json) so the
  browser shows exactly the clustering the topic names were recorded for.
- **HDBSCAN**: Campello, Moulavi & Sander 2013 (https://doi.org/10.1007/978-3-642-37456-2_14); our
  implementation follows scikit-learn's (https://scikit-learn.org/stable/modules/generated/sklearn.cluster.HDBSCAN.html)
  and is compared with scikit-learn 1.5.2 on a fixed dataset (identical noise; at most one point on a tied
  boundary differs). GLOSH outlier scores: Campello et al. 2015 (https://doi.org/10.1145/2733381).
- **c-TF-IDF**: Grootendorst 2022, BERTopic (https://arxiv.org/abs/2203.05794), eq. tf(t,c) · log(1 + A / f(t)).
- **Default result**: 6 clusters matching the 6 themes + 4 outliers; topic names recorded from gemma4:12b
  (temperature 0, 2026-11-25).

## Module 06 · prompt engineering

- **Task**: 8 test tickets with hand-checked answers (category, amount, currency, urgent); 2 few-shot examples.
- **Experiment**: 16 combinations of role / few-shot / chain-of-thought / JSON schema × 8 tickets × 4 samples
  (sample 0 at temperature 0 with token log-probabilities, samples 1–3 at 0.8), recorded 2026-11-25 from
  gemma4:12b and qwen2.5-coder:1.5b via Ollama 0.40.18 (`think: false`, `num_ctx` 32768).
  Results: gemma4 32/32 fields and valid JSON in every combination; qwen 1.5B 20–31/32, with every schema
  combination always valid. The statements in the lesson are checked by `claims.test.ts`.
- **Structured outputs**: Ollama `format` with a JSON schema (https://ollama.com/blog/structured-outputs).
- **Chain-of-thought**: Wei et al. 2022 (https://arxiv.org/abs/2201.11903).
- **In-context (few-shot) learning**: Brown et al. 2020 (https://arxiv.org/abs/2005.14165).
