M = {m["name"]: m for m in DATA["models"]}
kv = DATA["gen"]["kv"]

def kv_bytes_per_token(m, bytes_per_number=2):
    """One key and one value vector per layer per KV head, each d_model / heads numbers wide."""
    # TODO
    return 0

def cache_numbers(shape, layers):
    """Numbers in a cache whose keys (and values) in every layer have this shape."""
    # TODO
    return 0

print(kv_bytes_per_token(M["Llama 3 8B"]), cache_numbers(kv["layer_shape"], kv["layers"]))
