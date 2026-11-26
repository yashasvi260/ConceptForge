M = {m["name"]: m for m in DATA["models"]}

def gpt2_block_params(d, f):
    """(attention, feed_forward, norms) parameter counts for one GPT-2 block of width d and FFN width f.
    Attention: one fused d × 3d matrix for Q, K, V (+ 3d biases) and a d × d output matrix (+ d biases).
    Feed-forward: d × f (+ f biases), then f × d (+ d biases). Norms: two LayerNorms, each with d scales and d biases."""
    # TODO
    return 0, 0, 0

def gpt2_total(cfg):
    """Every parameter: token table (vocab × d), position table (context × d), all blocks, and a final LayerNorm.
    The output head reuses the token table, so it adds nothing."""
    # TODO
    return 0

print(gpt2_block_params(768, 3072), gpt2_total(M["GPT-2 small"]))
