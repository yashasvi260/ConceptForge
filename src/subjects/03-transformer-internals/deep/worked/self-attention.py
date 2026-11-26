# Worked example for "Self-attention in action": real GPT-2 small attention weights. Where the last token
# looks in three real heads, and which heads specialise, averaged over 8 sentences.
import json

g = DATA["m03"]["gpt2"]
s = g["sentences"][0]
A, toks = s["attn"], s["tokens"]
last = len(toks) - 1
heads = [(4, 11), (5, 1), (1, 6)]
row = [[repr(t)] + [round(A[l][h][last][j], 3) for l, h in heads] for j, t in enumerate(toks)]

hs = g["head_stats"]
def top(metric, k):
    flat = sorted(((v, l, h) for l, r in enumerate(hs[metric]) for h, v in enumerate(r)), reverse=True)
    return [[metric, f"layer {l}, head {h}", v] for v, l, h in flat[:k]]
def median(metric):
    vals = sorted(v for r in hs[metric] for v in r)
    return [metric, "median of all 144 heads", round((vals[71] + vals[72]) / 2, 3)]
spec = top("previous", 2) + [median("previous")] + top("first", 2) + [median("first")] + top("self", 1) + [median("self")]

n = len(toks)
upper = max(A[l][h][i][j] for l in range(12) for h in range(12) for i in range(n) for j in range(i + 1, n))
sinks = sum(1 for l in range(12) for h in range(12) if sum(A[l][h][i][0] for i in range(1, n)) / (n - 1) > 0.5)
print(json.dumps({
    "Where the last token, ' income', looks in three real GPT-2 heads": row,
    "What real GPT-2 heads specialise in (8 sentences)": spec,
    "Two facts from all 144 heads on this sentence": [["largest weight on a future token", upper], ["heads putting over half their attention on the first token", sinks]],
}))
