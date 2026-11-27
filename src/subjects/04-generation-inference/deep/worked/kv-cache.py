# Worked example for "The KV cache": the real cache GPT-2 small built in a 20-step loop, the loop with and without
# it (same tokens, timings on a CPU), and the cache per token for published configurations.
import json

g = DATA["m04"]["gen"]
kv = g["kv"]
shape = kv["layer_shape"]                       # (batch, heads, tokens, head width) for one layer's keys
per_tensor = shape[0] * shape[1] * shape[2] * shape[3]
numbers = 2 * kv["layers"] * per_tensor
stored = [
    ["keys, one layer", str(tuple(shape)), per_tensor],
    ["values, one layer", str(tuple(shape)), per_tensor],
    [f"all {kv['layers']} layers, keys and values", "", numbers],
    ["bytes in 32-bit floats", "", numbers * kv["bytes_per_number"]],
]

t = kv["timing"]
fed_c = sum(s["fed"] for s in kv["steps_cache"])
fed_n = sum(s["fed"] for s in kv["steps_nocache"])
compare = [
    ["tokens fed to the model over 20 steps", fed_c, fed_n],
    ["the same 20 tokens chosen", "yes" if kv["same_tokens"] else "no", "yes" if kv["same_tokens"] else "no"],
    ["one decode step at 512 tokens of context (ms)", t["decode_ms_median_cache"], t["decode_ms_median_nocache"]],
    ["64 new tokens after a 512-token prompt (s)", round(t["decode_total_ms_cache"] / 1000, 2), round(t["decode_total_ms_nocache"] / 1000, 2)],
]

models = []
for m in DATA["m04"]["models"]:
    dh = m["d_model"] // m["heads"]
    b = 2 * m["layers"] * m["kv_heads"] * dh * 2
    models.append([m["name"], m["layers"], m["kv_heads"], dh, b, m["context"], round(b * m["context"] / 1e9, 2)])

print(json.dumps({
    "GPT-2's real cache after a 20-step loop": stored,
    "The same loop with and without the cache (GPT-2 small, CPU)": compare,
    "KV cache per token in 16-bit, published configurations": models,
}))
