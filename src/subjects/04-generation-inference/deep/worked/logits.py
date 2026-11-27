# Worked example for "From the last vector to logits": GPT-2 small's real next-token scores after one prompt,
# and the shape of its distribution after four prompts (full 50,257-entry vocabulary, temperature 1).
import json

g = DATA["m04"]["gen"]
d0 = g["dists"][0]
top = [[repr(t["token"]), t["logit"], t["prob"]] for t in d0["top"][:8]]

shapes = []
for d in g["dists"]:
    t1 = next(t for t in d["temps"] if t["T"] == 1.0)
    shapes.append([d["prompt"], repr(d["top"][0]["token"]), d["top"][0]["prob"], t1["entropy_bits"], d["nucleus"]["0.9"]])

print(json.dumps({
    "GPT-2's top 8 next tokens after \"The capital of France is\"": top,
    "Four prompts, four shapes of distribution": shapes,
}))
