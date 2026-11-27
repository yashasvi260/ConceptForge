# Worked example for "The feed-forward network": activation functions at a few inputs, the feed-forward sizes of
# real models, and how many of GPT-2's 3,072 hidden units are clearly active on a real sentence.
import json
import numpy as np

def gelu(x):  # the tanh approximation GPT-2 uses
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))
silu = lambda x: x / (1 + np.exp(-x))
acts = [[x, max(0.0, x), round(float(gelu(x)), 3), round(float(silu(x)), 3)] for x in [-3.0, -1.0, -0.5, 0.0, 0.5, 1.0, 3.0]]

M = {m["name"]: m for m in DATA["m03"]["models"]}
sizes = []
for name in ["GPT-2 small", "Llama 3 8B", "GPT-3 175B"]:
    m = M[name]
    d, f = m["d_model"], m["ffn"]
    mats = 2 if m["family"] == "gpt2" else 3
    sizes.append([name, d, f, round(f / d, 2), mats, mats * d * f])

F = DATA["m03"]["gpt2"]["ffn"]
active = [[l + 1, F["active_share"][l], F["negative_share"][l]] for l in [0, 1, 5, 8, 11]]
print(json.dumps({
    "Activation functions at a few inputs": acts,
    "Feed-forward networks in real models": sizes,
    "How many of GPT-2's 3,072 hidden units are active (real)": active,
}))
