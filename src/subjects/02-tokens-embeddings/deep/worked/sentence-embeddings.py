# Worked example for "Sentence vectors and similarity": three ways to pool MiniLM's real token vectors, compared
# with MiniLM's own sentence vector, and the most and least similar pairs among 12 real banking questions.
import json
import numpy as np

unit = lambda v: v / np.linalg.norm(v)
p = DATA["minilm"]["pool"]["I forgot my login details"]
T, official = np.array(p["vectors"]), unit(np.array(p["sentence"]))
methods = [
    ["mean of all tokens, incl. [CLS] and [SEP]", unit(T.mean(axis=0))],
    ["mean of the word pieces only", unit(T[1:-1].mean(axis=0))],
    ["the [CLS] vector alone", unit(T[0])],
]

s = DATA["minilm"]["search"]
D = np.array(s["doc_vectors"])
C = D @ D.T
n = len(D)
pairs = sorted(((float(C[i, j]), i, j) for i in range(n) for j in range(i + 1, n)), reverse=True)
show = pairs[:3] + pairs[-2:]

print(json.dumps({
    "Three ways to pool one sentence, against MiniLM's own sentence vector": [[m, round(float(v @ official), 4)] for m, v in methods],
    "Most and least similar pairs among 12 banking questions": [[s["docs"][i], s["docs"][j], round(c, 3)] for c, i, j in show],
}))
