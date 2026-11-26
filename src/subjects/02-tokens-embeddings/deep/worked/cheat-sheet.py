# Worked example for the Module 02 recap: semantic search over 12 real MiniLM sentence vectors, evaluated on
# 6 labelled queries, and compared with a keyword-overlap baseline on the same data.
import json, re
import numpy as np

s = DATA["minilm"]["search"]
docs, D, Q, gold = s["docs"], np.array(s["doc_vectors"]), np.array(s["query_vectors"]), s["answers"]

def rank(order, g):
    return order.index(g) + 1

emb_rows, emb_ranks = [], []
for q, qv, g in zip(s["queries"], Q, gold):
    scores = D @ qv
    order = sorted(range(len(docs)), key=lambda i: -scores[i])
    emb_ranks.append(rank(order, g))
    emb_rows.append([q, docs[order[0]], round(float(scores[order[0]]), 3), rank(order, g)])

words = lambda t: set(re.findall(r"[a-z0-9']+", t.lower()))
kw_ranks = []
for q, g in zip(s["queries"], gold):
    sc = [len(words(q) & words(d)) / len(words(q) | words(d)) for d in docs]
    kw_ranks.append(rank(sorted(range(len(docs)), key=lambda i: -sc[i]), g))

metric = lambda r: [round(sum(x == 1 for x in r) / len(r), 3), round(sum(x <= 3 for x in r) / len(r), 3), round(sum(1 / x for x in r) / len(r), 3)]
print(json.dumps({
    "Embedding search on six labelled queries": emb_rows,
    "Embeddings vs keyword overlap on the same queries": [["MiniLM embeddings"] + metric(emb_ranks), ["keyword overlap (Jaccard)"] + metric(kw_ranks)],
}))
