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
