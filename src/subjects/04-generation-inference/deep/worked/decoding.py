# Worked example for "Greedy, temperature and beam search": how temperature reshapes GPT-2 small's real
# distribution after "The cat sat on the", and what greedy, beam search and sampling write from the same model.
import json

g = DATA["m04"]["gen"]
cat = g["dists"][1]
temps = [[t["T"], t["top1"], t["entropy_bits"], t["nucleus90"]] for t in cat["temps"] if t["T"] in (0.1, 0.5, 0.7, 1.0, 1.5, 2.0)]

def start(text, n=60):
    text = text.replace("\n", " ")
    return text[:n].rstrip() + "…"

gr = g["greedy"]["The cat sat on the"]
bm = g["beam"]
methods = [["greedy", start(gr["text"]), gr["logprob"]], ["beam search, 5 beams", start(bm["text"]), bm["logprob"]]]

samples = []
for s in g["samples"]:
    if s["seed"] == 0 and s["top_k"] == 0 and s["top_p"] == 1.0:
        samples.append([s["setting"], start(s["text"], 50), sum(r > 100 for r in s["ranks"]), max(s["ranks"])])

print(json.dumps({
    "Temperature reshapes GPT-2's distribution after \"The cat sat on the\"": temps,
    "Greedy and beam search from \"The cat sat on the\" (40 tokens)": methods,
    "Sampling from \"My favourite thing about weekends is\" (seed 0, 30 tokens)": samples,
}))
