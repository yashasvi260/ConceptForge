# Worked example for "Three families": who can see whom, and what each family is trained to predict.
import json

toks = ["the", "cat", "sat", "down"]
T = len(toks)
enc = [[t, *[1] * T] for t in toks]
dec = [[t, *[1 if j <= i else 0 for j in range(T)]] for i, t in enumerate(toks)]
pairs = [[" ".join(toks[: i + 1]), toks[i + 1]] for i in range(T - 1)]
print(json.dumps({
    "Encoder (bidirectional): 1 = may look": enc,
    "Decoder (causal): 1 = may look": dec,
    "A decoder's training examples from one sentence": pairs,
}))
