M = {m["name"]: m for m in DATA["models"]}
m = M["Llama 3 8B"]

def check_llama3_cache(ns):
    got = ns["kv_cache_bytes"](m["layers"], m["kv_heads"], 128, 8192)
    assert got == 1073741824, f"Llama 3 8B at 8,192 tokens in 16-bit: 1,073,741,824 bytes (1 GiB), got {got:,}"

def check_scales_linearly(ns):
    f = ns["kv_cache_bytes"]
    assert f(32, 32, 128, 8192) == 4 * f(32, 8, 128, 8192), "32 KV heads need 4× the memory of 8"
    assert f(32, 8, 128, 16384) == 2 * f(32, 8, 128, 8192), "twice the tokens, twice the memory"
    assert f(32, 8, 128, 8192, bytes_per_number=1) * 2 == f(32, 8, 128, 8192), "8-bit numbers halve it"
