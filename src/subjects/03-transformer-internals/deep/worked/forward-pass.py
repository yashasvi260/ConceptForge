# Worked example for "The forward pass, end to end": the shape of the data at every stage of GPT-2 small for one
# real 12-token sentence, and where one block's parameters live in GPT-2 small and Llama 3 8B.
import json

M = {m["name"]: m for m in DATA["m03"]["models"]}
g = M["GPT-2 small"]
s = DATA["m03"]["gpt2"]["sentences"][0]
n, d, H, f = len(s["tokens"]), g["d_model"], g["heads"], g["ffn"]
shapes = [
    ["token IDs", f"({n},)", n],
    ["token vectors + position vectors", f"({n}, {d})", n * d],
    ["attention weights in one block", f"({H}, {n}, {n})", H * n * n],
    ["feed-forward hidden layer", f"({n}, {f})", n * f],
    ["output of every block", f"({n}, {d})", n * d],
]

def block(m):
    d, f = m["d_model"], m["ffn"]
    if m["family"] == "gpt2":
        attn = d * 3 * d + 3 * d + d * d + d          # fused Q, K, V and the output projection, with biases
        ffn = d * f + f + f * d + d                    # two matrices with biases
        norms = 2 * 2 * d                              # two LayerNorms: scale and bias
    else:
        kv = m["kv_heads"] * (d // m["heads"])
        attn = d * d + 2 * d * kv + d * d              # Q, shared K and V, O; no biases
        ffn = 3 * d * f                                # SwiGLU: gate, up and down
        norms = 2 * d                                  # two RMSNorms: scale only
    return attn, ffn, norms

rows = []
for name in ["GPT-2 small", "Llama 3 8B"]:
    m = M[name]
    a, f_, nm = block(m)
    tot = a + f_ + nm
    rows.append([name, a, f_, nm, tot, round(100 * f_ / tot, 1), round(100 * m["layers"] * tot / m["total_params"], 1)])
print(json.dumps({
    "Shapes through GPT-2 small for one 12-token sentence": shapes,
    "Where one block's parameters live": rows,
}))
