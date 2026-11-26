# Worked example for "What large means": GPT-2 small's exact parameter count, part by part.
import json

V, d, n_ctx, L, ff = 50257, 768, 1024, 12, 3072

tok = V * d
pos = n_ctx * d
qkv = d * 3 * d + 3 * d
proj = d * d + d
fc = d * ff + ff
fc_out = ff * d + d
norms = 2 * (2 * d)
block = qkv + proj + fc + fc_out + norms
final_norm = 2 * d
total = tok + pos + L * block + final_norm

f = lambda n: f"{n:,}"
print(json.dumps({
    "Inside one GPT-2 small block": [
        ["attention: Q, K, V together", "768 × 2,304 + 2,304", f(qkv)],
        ["attention: output projection", "768 × 768 + 768", f(proj)],
        ["feed-forward: widen", "768 × 3,072 + 3,072", f(fc)],
        ["feed-forward: narrow", "3,072 × 768 + 768", f(fc_out)],
        ["two LayerNorms", "2 × (768 + 768)", f(norms)],
        ["one block", "sum of the above", f(block)],
    ],
    "GPT-2 small, all parts": [
        ["token embedding table", "50,257 × 768", f(tok), round(100 * tok / total, 1)],
        ["position table", "1,024 × 768", f(pos), round(100 * pos / total, 1)],
        ["12 blocks", f"12 × {f(block)}", f(L * block), round(100 * L * block / total, 1)],
        ["final LayerNorm", "768 + 768", f(final_norm), round(100 * final_norm / total, 3)],
        ["output head", "tied: reuses the token table", "0", 0],
        ["total", "", f(total), 100],
    ],
    "Memory for Llama 3 8B's 8,030,261,248 parameters": [
        [name, b, f"{8030261248 * b / 1e9:.2f} GB"] for name, b in [("fp32 (32-bit)", 4), ("fp16 / bf16", 2), ("int8", 1), ("int4", 0.5)]
    ],
}))
