llama = DATA["llama3-8b"]

def llama_params(c):
    """Exact parameter count of a Llama-style model: no biases, RMSNorm (scale only), no position table,
    grouped-query attention (K and V have kv_heads heads), SwiGLU feed-forward (3 matrices), separate head."""
    V, d, L, ff = c["vocab"], c["d_model"], c["layers"], c["ffn"]
    head_dim = d // c["heads"]
    kv_dim = c["kv_heads"] * head_dim
    embeddings = 0   # TODO: token table only
    attention = 0    # TODO: Q (d × d) + K (d × kv_dim) + V (d × kv_dim) + O (d × d)
    ffn = 0          # TODO: gate, up and down matrices, each d × ff
    norms = 0        # TODO: two RMSNorms per block, d scales each
    final_norm = 0   # TODO: one RMSNorm
    head = 0         # TODO: separate output matrix V × d
    return embeddings + L * (attention + ffn + norms) + final_norm + head

print(f"{llama_params(llama):,}")
