import numpy as np

S = DATA["search"]
DOCS, D = S["docs"], np.array(S["doc_vectors"])            # 12 real MiniLM sentence vectors (unit length)
QUERIES, Q = S["queries"], np.array(S["query_vectors"])   # 6 real query vectors
GOLD = S["answers"]                                        # index of the right document for each query

def search(query_vec, D, k):
    """The k best documents for a query, as (score, index), highest first. Vectors are unit length."""
    scores = D @ query_vec
    order = np.argsort(-scores)[:k]
    return [(float(scores[i]), int(i)) for i in order]

for q, qv in zip(QUERIES[:3], Q[:3]):
    print(q, "→", [(round(s, 3), DOCS[i]) for s, i in search(qv, D, 2)])
