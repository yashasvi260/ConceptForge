M = {m["name"]: m for m in DATA["models"]}

def llama_block_params(d, f, heads, kv_heads):
    """(attention, feed_forward, norms) for one Llama block. No biases anywhere.
    Attention: Q is d × d, K and V are each d × (kv_heads × head_dim), O is d × d (head_dim = d / heads).
    Feed-forward (SwiGLU): three matrices, gate and up (d × f) and down (f × d). Norms: two RMSNorms, d scales each."""
    # TODO
    return 0, 0, 0

def ffn_share(attention, feed_forward, norms):
    """Percentage of a block's parameters in its feed-forward network."""
    # TODO
    return 0.0

m = M["Llama 3 8B"]
parts = llama_block_params(m["d_model"], m["ffn"], m["heads"], m["kv_heads"])
print(parts, round(ffn_share(*parts), 1))
