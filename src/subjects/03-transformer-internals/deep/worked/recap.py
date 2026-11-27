# Worked example for the Module 03 recap: one GPT-2 small block, operation by operation (shapes and parameters
# for one real 12-token sentence), and a plain-NumPy forward pass with GPT-2's real weights against the real model.
import json

M = {m["name"]: m for m in DATA["m03"]["models"]}
g = M["GPT-2 small"]
d, f, H = g["d_model"], g["ffn"], g["heads"]
n = len(DATA["m03"]["gpt2"]["sentences"][0]["tokens"])
ops = [
    ["LayerNorm 1", f"({n}, {d})", 2 * d],
    ["Q, K, V in one product, split into 12 heads", f"3 × ({H}, {n}, {d // H})", d * 3 * d + 3 * d],
    ["scores, causal mask, softmax", f"({H}, {n}, {n})", 0],
    ["weighted values, heads merged, output projection", f"({n}, {d})", d * d + d],
    ["add to the stream (residual)", f"({n}, {d})", 0],
    ["LayerNorm 2", f"({n}, {d})", 2 * d],
    ["feed-forward: widen, GELU, narrow", f"({n}, {f}) → ({n}, {d})", d * f + f + f * d + d],
    ["add to the stream (residual)", f"({n}, {d})", 0],
]
ops.append(["one block in total", f"({n}, {d})", sum(r[2] for r in ops)])

chk = DATA["m03"]["gpt2"]["numpy_check"]["rows"]
print(json.dumps({
    "One GPT-2 small block, operation by operation": ops,
    "Plain NumPy with GPT-2's real weights vs the real model": chk,
}))
