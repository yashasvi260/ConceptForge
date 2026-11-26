# Worked example for "Encoder-decoder": cross-attention from one decoder position to the encoded input.
import json, math

src = ["the", "cat", "sleeps"]
H = [[1.0, 0.0], [0.0, 1.0], [0.5, 0.5]]   # encoder outputs, one 2-number vector per source token
q = [0.2, 1.0]                              # decoder query while writing the 2nd French word
d = 2
scores = [sum(a * b for a, b in zip(q, h)) / math.sqrt(d) for h in H]
e = [math.exp(s) for s in scores]
w = [x / sum(e) for x in e]
ctx = [sum(wi * h[k] for wi, h in zip(w, H)) for k in range(d)]
print(json.dumps({
    "Cross-attention while writing “chat”": [[t, round(s, 3), round(x, 3)] for t, s, x in zip(src, scores, w)],
    "context": [round(c, 3) for c in ctx],
}))
