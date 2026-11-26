llama = DATA["llama3-8b"]

def llama_params(c):
    """Exact parameter count of a Llama-style model: no biases, RMSNorm (scale only), no position table,
    grouped-query attention (K and V have kv_heads heads), SwiGLU feed-forward (3 matrices), separate head."""
    V, d, L, ff = c["vocab"], c["d_model"], c["layers"], c["ffn"]
    head_dim = d // c["heads"]
    kv_dim = c["kv_heads"] * head_dim
    embeddings = V * d
    attention = d * d + 2 * d * kv_dim + d * d
    ffn = 3 * d * ff
    norms = 2 * d
    final_norm = d
    head = V * d
    return embeddings + L * (attention + ffn + norms) + final_norm + head

print(f"{llama_params(llama):,}")
