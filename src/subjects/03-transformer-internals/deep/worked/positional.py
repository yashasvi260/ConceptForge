# Worked example for "Where am I? Positional information": sinusoidal position vectors (Vaswani et al. 2017),
# how similar GPT-2's real learned position vectors are at different distances, and RoPE's relative property.
import json
import numpy as np

def sinusoidal(pos, d):
    i = np.arange(d)
    angle = pos / 10000 ** (2 * (i // 2) / d)
    return np.where(i % 2 == 0, np.sin(angle), np.cos(angle))

sin_rows = [[p] + [round(float(v), 3) for v in sinusoidal(p, 16)[:6]] for p in [0, 1, 2, 3, 50]]

sim = DATA["m03"]["gpt2"]["position_similarity"]
learned = [[int(k), v] for k, v in sim.items()]

def rope(x, pos):
    d = len(x)
    theta = pos * 10000.0 ** (-2 * np.arange(d // 2) / d)
    c, s = np.cos(theta), np.sin(theta)
    out = np.empty(d)
    out[0::2] = x[0::2] * c - x[1::2] * s
    out[1::2] = x[0::2] * s + x[1::2] * c
    return out

q = np.array([0.9, 0.2, -0.4, 0.7])
k = np.array([0.5, -0.8, 0.3, 0.6])
rope_rows = [[m, n, m - n, round(float(rope(q, m) @ rope(k, n)), 4)] for m, n in [(5, 2), (105, 102), (3, 0), (7, 2), (2, 5)]]
print(json.dumps({
    "Sinusoidal position vectors (first 6 of 16 dimensions)": sin_rows,
    "GPT-2's learned position vectors: similarity by distance": learned,
    "RoPE: the score depends only on the distance": rope_rows,
}))
