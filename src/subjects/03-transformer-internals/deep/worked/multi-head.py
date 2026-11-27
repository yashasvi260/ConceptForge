# Worked example for "Multi-head attention": splitting GPT-2 small's width into heads, where the 12 real heads
# of one layer look, and what happens to GPT-2's loss when each head is switched off.
import json

g = DATA["m03"]["gpt2"]
d, n = g["config"]["d_model"], 12
split = []
for H in [1, 2, 12, 48]:
    params = 3 * d * d + 3 * d + d * d + d          # Q, K, V and output projection: the same for any H
    split.append([H, d // H, params, H * n * n])

s = g["sentences"][0]
toks, A = s["tokens"], s["attn"]
i = toks.index(" loan")
layer = 2
heads = []
for h in range(12):
    row = A[layer][h][i][: i + 1]
    top = max(range(i + 1), key=lambda j: row[j])
    rest = max(range(1, i + 1), key=lambda j: row[j])
    heads.append([h, repr(toks[top]), row[top], repr(toks[rest]), row[rest]])

ab = g["head_ablation"]
flat = sorted(((v, l, h) for l, r in enumerate(ab["loss_increase"]) for h, v in enumerate(r)), reverse=True)
vals = [v for v, _, _ in flat]
abl = [
    ["average loss with every head", ab["base_loss"]],
    ["heads whose removal adds less than 0.01", sum(v < 0.01 for v in vals)],
    ["heads whose removal adds less than 0.05", sum(v < 0.05 for v in vals)],
    ["heads whose removal adds more than 0.1", sum(v > 0.1 for v in vals)],
    [f"most important: layer {flat[0][1]}, head {flat[0][2]}", flat[0][0]],
    ["the previous-token head, layer 4, head 11", ab["loss_increase"][4][11]],
    [f"least important: layer {flat[-1][1]}, head {flat[-1][2]}", flat[-1][0]],
]
print(json.dumps({
    "Splitting GPT-2 small's 768 numbers into heads": split,
    "Where ' loan' looks in the 12 real heads of layer 2": heads,
    "Switching off one GPT-2 head at a time (8 sentences)": abl,
}))
