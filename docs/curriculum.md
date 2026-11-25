# CURRICULUM.md — End-to-End LLM Interactive Learning Syllabus

Build the **LLM Mastery** subject track following this 3-part, 12-module progression (plus 2 production systems modules). Each module must follow the platform's step-by-step interactive format: **Left Pane** (step narrative, intuition, formula/metric callout) + **Right Pane** (live interactive visualizer/simulator with parameter controls) + **Practice Check** (2–3 scenario questions per module).

---

## Part I: Understanding Language Models

### Module 1: Introduction to Language Models (`01-intro-llms`)
- **Core Concepts:** Bag-of-Words vs. Dense Vector Embeddings, Encoder-Only (Representation: BERT) vs. Decoder-Only (Generative: GPT/Llama) vs. Encoder-Decoder models, Pre-training vs. Fine-tuning paradigm.
- **Interactive Stage:**
  - Architecture Comparator toggle switching between Bag-of-Words sparse counts, Encoder bidirectional context, and Decoder causal generation.
  - Interactive timeline/diagram showing how input text flows differently through Representation vs. Generative models.

### Module 2: Tokens and Embeddings (`02-tokens-embeddings`)
- **Core Concepts:** Word vs. Subword (BPE / WordPiece) vs. Character vs. Byte tokenization, Vocabulary IDs, Token Embeddings lookup table, Static vs. Contextualized Word Embeddings, Sentence/Document Embeddings & Cosine Similarity.
- **Interactive Stage:**
  - Live **Tokenizer Playground** with preset strings (standard English, code, numbers, multilingual) showing token boundaries, token count, and IDs.
  - **Contextual Embedding Shift Visualizer:** Compare the word `"bank"` in `"The bank approved the loan"` vs. `"The river bank flooded"` and inspect cosine similarity scores across sentence embeddings.

### Module 3: Looking Inside Large Language Models (`03-transformer-internals`)
- **Core Concepts:** Transformer Forward Pass, Positional Embeddings (Sinusoidal vs. RoPE), Scaled Dot-Product Self-Attention ($Q, K, V$), Causal Masking, Multi-Head Attention & Grouped-Query Attention (GQA), Residual Connections & RMSNorm/LayerNorm, Feed-Forward Networks (SwiGLU/GELU), KV Cache, and Decoding/Sampling (Greedy, Temperature, Top-K, Top-P).
- **Interactive Stage:**
  - **Step-by-Step Transformer Block Blueprint:** Clickable tokens with live SVG attention arcs, $N \times N$ attention heatmap, Head selector, and Causal Mask toggle.
  - **Inference Controls:** Live Temperature & Top-P sliders updating next-token probability bars, plus a **KV Cache ON vs. OFF** compute/memory comparison chart.

---

## Part II: Using Pretrained Language Models

### Module 4: Text Classification (`04-text-classification`)
- **Core Concepts:** Task-specific classification heads on Representation models, Embedding + Classifier / Zero-Shot Cosine Similarity (NLI / label embeddings), Generative classification via prompting.
- **Interactive Stage:**
  - **3-Way Classifier Comparator:** Pass a sample customer review or banking support ticket through (1) Fine-Tuned Encoder Head, (2) Zero-Shot Embedding Similarity, and (3) Generative LLM Prompting, comparing latency, cost, and confidence scores.

### Module 5: Text Clustering and Topic Modeling (`05-clustering-topics`)
- **Core Concepts:** Document Embeddings $\rightarrow$ Dimensionality Reduction (UMAP) $\rightarrow$ Density Clustering (HDBSCAN) $\rightarrow$ Topic Representation (c-TF-IDF / BERTopic).
- **Interactive Stage:**
  - **2D Interactive Cluster Scatter Plot:** Step through raw documents $\rightarrow$ high-D embeddings $\rightarrow$ UMAP projection $\rightarrow$ HDBSCAN clusters, with sliders for **Cluster Granularity (`min_cluster_size`)** and **Outlier Threshold** updating cluster labels live.

### Module 6: Prompt Engineering (`06-prompt-engineering`)
- **Core Concepts:** Prompt anatomy (System/Role, Context, Instruction, Output Format), Zero-Shot vs. Few-Shot In-Context Learning, Chain-of-Thought (CoT) reasoning, Prompt Chaining, Structured Outputs (JSON Schema).
- **Interactive Stage:**
  - **Modular Prompt Builder & Probability Inspector:** Toggle prompt components on/off (Role, Few-Shot Examples, Chain-of-Thought, JSON Schema) and step through how each addition constrains output variance and improves task accuracy.

### Module 7: Advanced Text Generation Techniques & Tools (`07-agents-tools`)
- **Core Concepts:** Loading Quantized Models (FP16 vs. INT8 / INT4), Multi-step Chains, Conversation Memory Strategies (Full Buffer, Sliding Window, Summary Memory), Tool Calling & ReAct Agent Loops.
- **Interactive Stage:**
  - **Memory Eviction & Agent Loop Simulator:** Simulate a multi-turn conversation to watch how Buffer, Windowed, and Summary memory manage token budgets, then step through a ReAct Tool-Calling loop (`Thought → Tool Call → Observation → Final Answer`).

### Module 8: Semantic Search and Retrieval-Augmented Generation (`08-semantic-search-rag`)
- **Core Concepts:** Chunking strategies, Dense Retrieval vs. Keyword (BM25) Hybrid Search, Bi-Encoder vs. Cross-Encoder Reranking, Retrieval Metrics (Recall@K, MRR, NDCG), Grounded Generation & Faithfulness Evaluation.
- **Interactive Stage:**
  - **End-to-End RAG Pipeline Explorer:** Adjust **Chunk Size**, toggle **Hybrid Search (Dense + BM25)** and **Cross-Encoder Reranker**, and watch retrieved chunks re-order and highlight grounded citations in the generated answer.

### Module 9: Multimodal Large Language Models (`09-multimodal-llms`)
- **Core Concepts:** Vision Transformers (Image Patch Tokenization), Contrastive Vision-Text Alignment (CLIP shared embedding space), Modality Bridge / Projection Layers (BLIP-2 / LLaVA style) connecting image encoders to text decoders.
- **Interactive Stage:**
  - **Image-to-Patch & Cross-Modal Similarity Explorer:** Hover over grid patches on a sample image to see patch embeddings, compute similarity against candidate text captions in CLIP space, and trace how projected visual tokens enter the LLM context alongside text tokens.

---

## Part III: Training and Fine-Tuning Language Models

### Module 10: Creating Text Embedding Models (`10-training-embeddings`)
- **Core Concepts:** Contrastive Learning, Positive & Hard-Negative Pairs, Cosine Similarity / Multiple Negatives Ranking Loss, Bi-Encoder vs. Cross-Encoder architectures.
- **Interactive Stage:**
  - **Contrastive Vector Space Stepper:** Step through training batches and watch anchor-positive pairs pull together while hard-negative pairs push apart in vector space, updating similarity margins live.

### Module 11: Fine-Tuning Representation Models for Classification (`11-finetuning-encoders`)
- **Core Concepts:** Full Fine-Tuning vs. Freezing Backbone Layers, Few-Shot Contrastive Fine-Tuning (SetFit), Trainable Parameters vs. Compute/Overfitting trade-offs.
- **Interactive Stage:**
  - **Layer-Freeze & Data-Size Simulator:** Toggle how many transformer layers are frozen vs. unfrozen and adjust labeled dataset size (`16` to `10,000` samples) to compare VRAM usage, training speed, and validation accuracy.

### Module 12: Fine-Tuning Generation Models (`12-finetuning-generation`)
- **Core Concepts:** Supervised Fine-Tuning (SFT) with chat templates, Parameter-Efficient Fine-Tuning (LoRA low-rank matrices $W + \Delta W = W + A \cdot B$, QLoRA 4-bit base + FP16 adapters), Preference Alignment (RLHF / Reward Model vs. DPO), Model Evaluation.
- **Interactive Stage:**
  - **LoRA Rank & Alignment Visualizer:** Adjust LoRA **Rank ($r = 4, 8, 16, 64$)** to inspect trainable parameter percentages and memory savings, then step through a **DPO Chosen vs. Rejected** preference update shifting token log-probabilities.

---

## Part IV: Production Inference & Guardrails (Capstone Modules)

### Module 13: Production Serving & Inference Optimization (`13-inference-serving`)
- **Core Concepts:** Prefill vs. Decode phases, FlashAttention (IO-aware tiling), PagedAttention (non-contiguous KV memory blocks), Continuous Batching, Speculative Decoding (Draft + Target verification).
- **Interactive Stage:**
  - **GPU VRAM & Request Scheduler Simulator:** Toggle PagedAttention and Continuous Batching to watch GPU memory fragmentation drop and token throughput (tokens/sec) rise under concurrent user requests.

### Module 14: Evals, Guardrails & Failure Modes (`14-evals-guardrails`)
- **Core Concepts:** Golden Datasets, Deterministic Assertions vs. LLM-as-a-Judge, Hallucination & Faithfulness checks, Prompt Injection defense, Latency/Cost/Quality routing.
- **Interactive Stage:**
  - **Guardrail & Eval Pipeline Sandbox:** Test adversarial prompts (prompt injection, PII leak, ungrounded query) through input/output guardrail layers and inspect pass/fail evaluation rubrics.