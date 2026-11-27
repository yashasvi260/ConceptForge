# Worked example for "Residual connections and normalisation": how long real GPT-2 vectors get along the
# residual stream, what GPT-2's first LayerNorm does to one real vector, and LayerNorm vs RMSNorm on a small vector.
import json
import numpy as np

g = DATA["m03"]["gpt2"]
R = g["residual_norms"]
toks, N = R["tokens"], R["norms"]
cols = [0, 1, len(toks) - 1]
labels = ["token + position vectors"] + [f"after block {l}" for l in range(1, 12)] + ["after block 12 and the final LayerNorm"]
stream = [[labels[k]] + [N[k][i] for i in cols] for k in [0, 1, 2, 3, 6, 9, 11, 12]]

ln = g["layernorm"]
real_ln = [
    ["before LayerNorm", ln["before"]["mean"], ln["before"]["std"]],
    ["after subtracting the mean and dividing by the std", ln["normalised"]["mean"], ln["normalised"]["std"]],
    ["after GPT-2's learned gain and bias", ln["after_gain_bias"]["mean"], ln["after_gain_bias"]["std"]],
]

x = np.array([2.0, -1.0, 0.5, 8.0])
layer = (x - x.mean()) / np.sqrt(x.var() + 1e-5)
rms = x / np.sqrt((x ** 2).mean() + 1e-6)
small = [["input x"] + x.tolist(), ["LayerNorm(x)"] + [round(float(v), 3) for v in layer], ["RMSNorm(x)"] + [round(float(v), 3) for v in rms]]
print(json.dumps({
    "Vector length along GPT-2's residual stream (real)": stream,
    "GPT-2's first LayerNorm on one real vector (' approved')": real_ln,
    "LayerNorm vs RMSNorm on a small vector": small,
}))
