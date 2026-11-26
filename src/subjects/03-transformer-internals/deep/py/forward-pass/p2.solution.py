M = {m["name"]: m for m in DATA["models"]}

def gpt2_block_params(d, f):
    """(attention, feed_forward, norms) parameter counts for one GPT-2 block of width d and FFN width f.
    Attention: one fused d × 3d matrix for Q, K, V (+ 3d biases) and a d × d output matrix (+ d biases).
    Feed-forward: d × f (+ f biases), then f × d (+ d biases). Norms: two LayerNorms, each with d scales and d biases."""
    attention = d * 3 * d + 3 * d + d * d + d
    feed_forward = d * f + f + f * d + d
    norms = 2 * (d + d)
    return attention, feed_forward, norms

def gpt2_total(cfg):
    """Every parameter: token table (vocab × d), position table (context × d), all blocks, and a final LayerNorm.
    The output head reuses the token table, so it adds nothing."""
    d = cfg["d_model"]
    block = sum(gpt2_block_params(d, cfg["ffn"]))
    return cfg["vocab"] * d + cfg["context"] * d + cfg["layers"] * block + 2 * d

print(gpt2_block_params(768, 3072), gpt2_total(M["GPT-2 small"]))
