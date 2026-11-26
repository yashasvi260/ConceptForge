SEARCH = DATA["search"]
DOCS, D = SEARCH["docs"], np.array(SEARCH["doc_vectors"])   # 12 real MiniLM sentence vectors (already length 1)

def similarity_matrix(D):
    """For unit-length vectors, cosine similarity is just the dot product: one matrix product."""
    return D @ D.T

def top_pairs(D, k):
    """The k most similar pairs (i < j), most similar first, as (score, i, j)."""
    C = similarity_matrix(D)
    pairs = [(float(C[i, j]), i, j) for i in range(len(D)) for j in range(i + 1, len(D))]
    return sorted(pairs, reverse=True)[:k]

for score, i, j in top_pairs(D, 3):
    print(f"{score:.3f}  {DOCS[i]}  |  {DOCS[j]}")
