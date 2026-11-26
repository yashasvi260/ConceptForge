# DATA holds the published configurations, e.g. DATA["gpt2-small"]["d_model"] == 768.
gpt2 = DATA["gpt2-small"]
print(gpt2)

def gpt2_params(c):
    """Exact parameter count of a GPT-2-style model (biases, LayerNorms, learned positions, tied head)."""
    V, d, n_ctx, L, ff = c["vocab"], c["d_model"], c["context"], c["layers"], c["ffn"]
    embeddings = V * d + n_ctx * d
    attention = d * 3 * d + 3 * d + d * d + d
    ffn = d * ff + ff + ff * d + d
    norms = 2 * (2 * d)
    final_norm = 2 * d
    return embeddings + L * (attention + ffn + norms) + final_norm

print(f"{gpt2_params(gpt2):,}")
