# Module 01 coverage checklist

Status: **built from primary sources.** The owner's reference book (*Hands-On Large Language Models*) was not yet
in `reference/` when this was written. Re-run this check against its Chapter 1, and the parts of Chapters 2–3 that
Module 01 previews, once the file is there. Topics are paraphrased, and nothing from the book is copied.

Sources:
- Vaswani et al. 2017 (Transformer)
- Radford et al. 2018 (GPT) and 2019 (GPT-2)
- Devlin et al. 2019 (BERT)
- Raffel et al. 2020 (T5)
- Mikolov et al. 2013 (word2vec)
- Kaplan et al. 2020 (scaling laws)
- Meta 2024 (Llama 3, arXiv 2407.21783)
- Ouyang et al. 2022 (InstructGPT)

Each topic below names the step that teaches it and the section where it lands. Labels in brackets are concept
sub-parts; *worked* and *build* are the Worked example and Build it sections. Every topic below was a gap in the old
short steps; the step and section say where the deep lesson fills it.

## What a language model does (`big-picture`)

- **What "language modelling" means: predict the next token, P(next | previous).** [Next-token prediction] + formula
- **Autoregressive generation loop: append and repeat.** [The generation loop] + build (bigram generate)
- **Greedy vs sampling, introduced only; Module 03 owns it.** [Choosing the next token], one paragraph and a forward link

## Anatomy of an LLM (`anatomy`)

- **Tokens and the tokenizer: text → IDs; vocabulary size.** [Tokenizer] + worked ("The cat sat" → GPT-2 IDs)
- **Embedding table as a lookup: shape V × d.** [Embedding table] + worked
- **Position information: why order must be added.** [Positions], plus a "Dog bites man" mistake
- **Attention as weighted mixing: scores → softmax → weighted sum.** [Attention, in one picture] + worked 3 × 3 matrix
- **Feed-forward network per token.** [Feed-forward]
- **Residual connections and normalisation.** [Keeping the signal stable]
- **Stacking N blocks.** [The stack]
- **Output head → logits → softmax → probabilities.** [Output head] + formula
- **Tensor shapes through the whole pipeline.** worked table + build (prints shapes)

## What "large" means (`how-large`)

- **Parameter = learned number, and where each one lives.** [Parameters]
- **Counting formulas: embedding V·d, attention 4d², FFN 2·d·d_ff, norms.** [Counting them] + formula + build
- **Context window vs parameters (different things).** [Two other sizes], mistake
- **Training tokens (Llama 3: over 15T).** [Two other sizes]
- **Memory = parameters × bytes per value (fp32/fp16/int8/int4).** [Memory] + build

## Training vs using a model (`train-vs-use`)

- **Loss (cross-entropy) on next-token prediction.** [What training minimises] + formula
- **Gradient descent: nudge weights against the gradient.** [One step of learning] + build (2-weight model)
- **Training compute ≈ 6·N·D; inference ≈ 2·N per token.** [Compute] + formula + build
- **Inference never changes weights; chat memory lives in context.** mistake

## Bag-of-Words (`bag-of-words`)

- **Vocabulary, count vectors, document-term matrix.** worked + build
- **Cosine similarity.** formula + build
- **Loses order and meaning ("Dog bites man" = "Man bites dog").** mistake

## Dense embeddings (`dense-embeddings`)

- **Word2vec idea: learn vectors from the words around each word.** [Where dense vectors come from]
- **Sentence embeddings (mean pooling, MiniLM 384-d).** [Sentence vectors]
- **Similarity search with real vectors.** build (MiniLM data) + local (sentence-transformers)

## Context changes meaning (`context`)

- **Static vs contextual embeddings ("bank").** worked + build (real token vectors)
- **Why attention produces context.** [Context comes from attention]

## Three families (`architectures`)

- **Encoder-only (BERT), decoder-only (GPT), encoder-decoder (T5).** [The three families]
- **Causal vs bidirectional masks.** formula + build
- **Masked-LM vs next-token objectives.** [What each is trained to do]

## Encoder-decoder (`encoder-decoder`)

- **Cross-attention: the decoder queries the encoder's outputs.** formula + build (shapes)
- **Typical uses: translation and summarisation.** local (t5-small)

## Representation vs generative models (`representation-vs-generative`)

- **Embedding models vs text generators, and when to use each.** [Two jobs]
- **Classify with vectors (nearest centroid).** build + local (sentence-transformers + Ollama)

## Pre-training then fine-tuning (`pretraining-finetuning`)

- **Pre-training on general text; fine-tuning on task or domain data.** [Two stages]
- **Instruction tuning and RLHF, named and linked to Part III.** [From base model to assistant]
- **Fine-tuning shifts probabilities.** build (bigram counts)

## The map you'll fill in (`recap`)

- **The end-to-end pipeline rebuilt by the learner.** mini-project (4 parts)
