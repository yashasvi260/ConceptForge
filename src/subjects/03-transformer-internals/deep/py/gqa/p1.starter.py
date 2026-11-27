M = {m["name"]: m for m in DATA["models"]}

def kv_cache_bytes(layers, kv_heads, d_head, tokens, bytes_per_number=2):
    """Memory for the cached keys and values of one sequence: a K and a V vector per token, per layer, per KV head."""
    # TODO
    return 0

m = M["Llama 3 8B"]
print(kv_cache_bytes(m["layers"], m["kv_heads"], m["d_model"] // m["heads"], 8192) / 1e9, "GB")
