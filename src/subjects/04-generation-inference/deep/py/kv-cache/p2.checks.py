M = {m["name"]: m for m in DATA["models"]}
kv = DATA["gen"]["kv"]

def check_published(ns):
    f = ns["kv_bytes_per_token"]
    assert f(M["Llama 3 8B"]) == 131072, f"Llama 3 8B in 16-bit: 2 · 32 · 8 · 128 · 2 = 131,072 bytes per token, got {f(M['Llama 3 8B'])}"
    assert f(M["GPT-2 small"], 4) == 73728, "GPT-2 small in 32-bit: 2 · 12 · 12 · 64 · 4 = 73,728 bytes per token"
    assert f(M["GPT-3 175B"]) == 4718592, "GPT-3: 4,718,592 bytes (4.7 MB) per token"

def check_real_cache(ns):
    n = ns["cache_numbers"](kv["layer_shape"], kv["layers"])
    tokens = kv["layer_shape"][2]
    assert n == 442368, f"GPT-2's real cache after the loop: 2 × 12 layers × 1·12·24·64 = 442,368 numbers, got {n}"
    assert n * 4 == ns["kv_bytes_per_token"](M["GPT-2 small"], 4) * tokens, "and that's exactly 73,728 bytes per token × 24 tokens"
