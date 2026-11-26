# DATA holds the published configurations, e.g. DATA["gpt2-small"]["d_model"] == 768.
gpt2 = DATA["gpt2-small"]
print(gpt2)

def gpt2_params(c):
    """Exact parameter count of a GPT-2-style model (biases, LayerNorms, learned positions, tied head)."""
    V, d, n_ctx, L, ff = c["vocab"], c["d_model"], c["context"], c["layers"], c["ffn"]
    embeddings = 0   # TODO: token table (V × d) + position table (n_ctx × d)
    attention = 0    # TODO: Q,K,V matrix d × 3d plus 3d biases, output matrix d × d plus d biases
    ffn = 0          # TODO: d × ff plus ff biases, ff × d plus d biases
    norms = 0        # TODO: two LayerNorms per block, each with d scales and d biases
    final_norm = 0   # TODO: one more LayerNorm after the last block
    return embeddings + L * (attention + ffn + norms) + final_norm

print(f"{gpt2_params(gpt2):,}")
