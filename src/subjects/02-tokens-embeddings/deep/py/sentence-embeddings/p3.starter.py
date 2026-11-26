SEARCH = DATA["search"]
DOCS, D = SEARCH["docs"], np.array(SEARCH["doc_vectors"])   # 12 real MiniLM sentence vectors (already length 1)

def similarity_matrix(D):
    """For unit-length vectors, cosine similarity is just the dot product: one matrix product."""
    # TODO
    return np.zeros((len(D), len(D)))

def top_pairs(D, k):
    """The k most similar pairs (i < j), most similar first, as (score, i, j)."""
    C = similarity_matrix(D)
    # TODO: collect (C[i, j], i, j) for every i < j and sort descending
    return []

for score, i, j in top_pairs(D, 3):
    print(f"{score:.3f}  {DOCS[i]}  |  {DOCS[j]}")
