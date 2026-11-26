M = {m["name"]: m for m in DATA["models"]}

def llama_block_params(d, f, heads, kv_heads):
    """(attention, feed_forward, norms) for one Llama block. No biases anywhere.
    Attention: Q is d × d, K and V are each d × (kv_heads × head_dim), O is d × d (head_dim = d / heads).
    Feed-forward (SwiGLU): three matrices, gate and up (d × f) and down (f × d). Norms: two RMSNorms, d scales each."""
    kv = kv_heads * (d // heads)
    attention = d * d + 2 * d * kv + d * d
    feed_forward = 3 * d * f
    norms = 2 * d
    return attention, feed_forward, norms

def ffn_share(attention, feed_forward, norms):
    """Percentage of a block's parameters in its feed-forward network."""
    return 100 * feed_forward / (attention + feed_forward + norms)

m = M["Llama 3 8B"]
parts = llama_block_params(m["d_model"], m["ffn"], m["heads"], m["kv_heads"])
print(parts, round(ffn_share(*parts), 1))
