M = {m["name"]: m for m in DATA["models"]}
kv = DATA["gen"]["kv"]

def kv_bytes_per_token(m, bytes_per_number=2):
    """One key and one value vector per layer per KV head, each d_model / heads numbers wide."""
    return 2 * m["layers"] * m["kv_heads"] * (m["d_model"] // m["heads"]) * bytes_per_number

def cache_numbers(shape, layers):
    """Numbers in a cache whose keys (and values) in every layer have this shape."""
    n = 1
    for s in shape:
        n *= s
    return 2 * layers * n

print(kv_bytes_per_token(M["Llama 3 8B"]), cache_numbers(kv["layer_shape"], kv["layers"]))
