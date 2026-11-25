# Part I (Modules 01–03): verified facts and sources

Checked 2026-11-25 against the papers' own text (abstracts on arxiv.org, full text on ar5iv / the PDF).

## Model families and training paradigm

| Claim | Source |
|---|---|
| BERT is bidirectional: "jointly conditioning on both left and right context in all layers"; fine-tuned "with just one additional output layer". | Devlin et al. 2019, abstract — https://arxiv.org/abs/1810.04805 |
| BERT's masked-LM objective: mask 15% of WordPiece positions at random and predict them; a chosen token becomes `[MASK]` 80% of the time, a random token 10%, unchanged 10%. | BERT §3.1 — https://ar5iv.labs.arxiv.org/html/1810.04805 |
| BERT-Base: L=12 layers, H=768, A=12 heads, 110M parameters. | BERT §3 |
| GPT (2018) uses "a multi-layer Transformer decoder" for the language model; training "consists of two stages": a language model on a large corpus, then fine-tuning on a labelled task. | Radford et al. 2018, §3 (PDF text) — https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf |
| T5 frames every task as text-to-text and uses an "encoder-decoder Transformer implementation" following Vaswani et al. | Raffel et al. 2020, abstract and §2.1 — https://arxiv.org/abs/1910.10683 |
| The Transformer is "based solely on attention mechanisms". | Vaswani et al. 2017 — https://arxiv.org/abs/1706.03762 |

## Embeddings model used in the browser

| Claim | Source |
|---|---|
| all-MiniLM-L6-v2 maps text to a 384-dimensional dense vector; mean pooling (usage code); input longer than 256 word pieces is truncated; intended as a sentence and short-paragraph encoder; Apache-2.0. | https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 |
| MiniLM config: 6 layers, 12 heads, hidden size 384, 512 positions, vocab_size 30,522; its WordPiece vocabulary is BERT's (`bank` = 2924, `##ffa` = 20961 in both). | public/models/Xenova/all-MiniLM-L6-v2/config.json, tokenizer.json (checked) |
| Measured (MiniLM): `bank` vectors loan↔river 0.826, river↔river 0.902, loan↔deposited 0.806; search "I can't sign in to my account" ranks password 0.561, login 0.513, others ≤ 0.18. | computed with the model (node) |
| Browser copy: `Xenova/all-MiniLM-L6-v2`, `onnx/model_quantized.onnx` = 22,972,370 bytes, Apache-2.0. | Hugging Face API / file headers |

## Transformer internals (Module 03)

| Claim | Source |
|---|---|
| Attention(Q,K,V) = softmax(QKᵀ/√d_k)V; scaled because large dot products push softmax into regions with tiny gradients (dot product of unit-variance components has variance d_k). | Vaswani et al. §3.2.1 |
| Sinusoidal positions: PE(pos,2i)=sin(pos/10000^(2i/d)), PE(pos,2i+1)=cos(pos/10000^(2i/d)). | Vaswani et al. §3.5 |
| RoPE "encodes the absolute position with a rotation matrix" and "incorporates the explicit relative position dependency in self-attention". | Su et al. 2021 — https://arxiv.org/abs/2104.09864 |
| GQA uses "an intermediate (more than one, less than number of query heads) number of key-value heads" (generalises multi-query attention). | Ainslie et al. 2023 — https://arxiv.org/abs/2305.13245 |
| RMSNorm normalises by root mean square, drops LayerNorm's re-centering ("dispensable") and is "computationally simpler and thus more efficient". | Zhang & Sennrich 2019 — https://arxiv.org/abs/1910.07467 |
| FFN_SwiGLU(x) = (Swish₁(xW) ⊗ xV)W₂, Swish_β(x) = x·σ(βx); GLU variants replace the first linear layer + activation in the FFN. | Shazeer 2020 §2 — https://ar5iv.labs.arxiv.org/html/2002.05202 |
| GELU(x) = x·Φ(x), Φ = standard normal CDF (the lesson uses the common tanh approximation, labelled). | Hendrycks & Gimpel — https://arxiv.org/abs/1606.08415 |
| Top-k sampling: "randomly sample from the k=10 most likely candidates". | Fan et al. 2018 §5.4 — https://ar5iv.labs.arxiv.org/html/1805.04833 |
| Nucleus (top-p) sampling: sample "from the dynamic nucleus of the probability distribution", "truncating the less reliable tail". | Holtzman et al. 2020 — https://arxiv.org/abs/1904.09751 |

## Labelled as illustrative in the lessons

- Attention patterns (hand-designed heads) and next-token logits: a generative model is too heavy for the browser.
- Bag-of-Words: standard definition (word counts, order ignored); computed live.

## Corrections to the design

None: every design claim checked out. Detail added: BERT's 80/10/10 masking rule and BERT-Base size.
