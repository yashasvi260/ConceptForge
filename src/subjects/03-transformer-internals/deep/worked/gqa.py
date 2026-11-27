# Worked example for "Grouped-query attention": KV-cache memory from published configurations, for Llama 3 8B
# as published (8 KV heads) and with the alternatives, and how its 32 query heads share 8 key-value heads.
import json

M = {m["name"]: m for m in DATA["m03"]["models"]}

def per_token(layers, kv_heads, d_head, bytes_per_number=2):
    return 2 * layers * kv_heads * d_head * bytes_per_number       # a K and a V vector per layer per KV head

ll = M["Llama 3 8B"]
dh = ll["d_model"] // ll["heads"]
rows = []
for label, kv in [("Llama 3 8B, multi-head (32 KV heads)", 32), ("Llama 3 8B as published, GQA (8 KV heads)", 8), ("Llama 3 8B, multi-query (1 KV head)", 1)]:
    b = per_token(ll["layers"], kv, dh)
    rows.append([label, b, round(b * 8192 / 1e9, 2)])
g3 = M["GPT-3 175B"]
b = per_token(g3["layers"], g3["kv_heads"], g3["d_model"] // g3["heads"])
rows.append(["GPT-3 175B, multi-head (96 KV heads)", b, round(b * 8192 / 1e9, 2)])

group = ll["heads"] // ll["kv_heads"]
share = [[f"{k * group}–{k * group + group - 1}", k] for k in range(ll["kv_heads"])]
print(json.dumps({
    "KV cache, 16-bit numbers": rows,
    "How Llama 3 8B's 32 query heads share 8 key-value heads": share,
}))
