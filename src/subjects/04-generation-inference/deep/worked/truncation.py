# Worked example for "Cutting the tail": how much of GPT-2 small's real probability lies in the tail, how many
# tokens top-k, top-p and min-p keep on four prompts, and what truncation does to real samples at T = 1.
import json

g = DATA["m04"]["gen"]
tail = [[d["prompt"], d["tail"]["10"], d["tail"]["100"], d["tail"]["1000"]] for d in g["dists"]]
keep = [[d["prompt"], round(1 - d["tail"]["40"], 3), d["nucleus"]["0.9"], d["minp"]["0.1"]] for d in g["dists"]]

samples = []
for setting in ["T=1.0", "T=1.0, top-k 40", "T=1.0, top-p 0.9"]:
    runs = [s for s in g["samples"] if s["setting"] == setting]
    ranks = [r for s in runs for r in s["ranks"]]
    samples.append([setting, sum(r > 100 for r in ranks), max(ranks), round(sum(s["logprob"] for s in runs) / len(runs), 1)])

print(json.dumps({
    "Probability GPT-2 leaves outside its top k tokens": tail,
    "What each rule keeps on four prompts": keep,
    "Three seeds × 30 tokens from \"My favourite thing about weekends is\", T = 1": samples,
}))
