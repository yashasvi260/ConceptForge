# Worked example for "Mixture of Experts": Mixtral 8x7B's total and active parameters from its published
# configuration, how a router picks 2 of 8 experts for one token (made-up router scores), and the Switch
# Transformer's load-balancing loss on two made-up batches.
import json
import numpy as np

m = DATA["m03"]["mixtral"]
d, f, L, E, k = m["d_model"], m["ffn"], m["layers"], m["experts"], m["experts_per_token"]
kv = m["kv_heads"] * (d // m["heads"])
attn = 2 * d * d + 2 * d * kv
expert = 3 * d * f
router = d * E
norms = 2 * d
embed = 2 * m["vocab"] * d                 # token table + separate output head
total = L * (attn + E * expert + router + norms) + d + embed
active = L * (attn + k * expert + router + norms) + d + embed
params = [
    ["attention, one block", attn],
    ["one expert (a SwiGLU network)", expert],
    ["all 8 experts, one block", E * expert],
    ["router, one block", router],
    ["whole model", total],
    ["used for one token (2 experts per block)", active],
]

scores = np.array([1.2, -0.3, 2.1, 0.4, -1.0, 1.9, 0.0, -0.5])     # made-up router scores for one token
p = np.exp(scores - scores.max()); p /= p.sum()
top = np.argsort(-scores)[:k]
w = p[top] / p[top].sum()
route = [[e, float(scores[e]), round(float(p[e]), 3), "yes" if e in top else "", round(float(w[list(top).index(e)]), 3) if e in top else 0] for e in range(E)]

def switch_loss(probs, chosen, n_experts):
    f_i = np.bincount(chosen, minlength=n_experts) / len(chosen)       # share of tokens sent to each expert
    P_i = probs.mean(axis=0)                                            # average router probability per expert
    return float(n_experts * (f_i * P_i).sum())
balanced = np.full((8, 4), 0.25)
collapsed = np.tile([0.7, 0.1, 0.1, 0.1], (8, 1))
balance = [
    ["every expert gets 2 of the 8 tokens", round(switch_loss(balanced, np.array([0, 1, 2, 3, 0, 1, 2, 3]), 4), 3)],
    ["every token goes to expert 0", round(switch_loss(collapsed, np.zeros(8, dtype=int), 4), 3)],
]
print(json.dumps({
    "Mixtral 8x7B's parameters (published configuration)": params,
    "Routing one token to 2 of 8 experts (made-up router scores)": route,
    "Load-balancing loss on two made-up batches (4 experts)": balance,
}))
