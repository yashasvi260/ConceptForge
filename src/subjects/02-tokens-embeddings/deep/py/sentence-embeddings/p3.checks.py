import numpy as np
S = DATA["search"]
D = np.array(S["doc_vectors"])

def check_dot_equals_cosine_for_unit_vectors(ns):
    C = ns["similarity_matrix"](D)
    assert C.shape == (12, 12) and np.allclose(np.diag(C), 1, atol=1e-3), "12 × 12, with about 1.0 on the diagonal (vectors have length 1)"

def check_most_similar_pair(ns):
    got = ns["top_pairs"](D, 1)
    assert got and (got[0][1], got[0][2]) == (0, 1), f"'How do I reset my password?' and 'I forgot my login details' are the closest pair (0.576), got {got}"

def check_shared_words_still_count(ns):
    got = ns["top_pairs"](D, 2)
    assert len(got) == 2 and (got[1][1], got[1][2]) == (6, 11), f"second: 'order a new debit card' vs 'set up a direct debit' (0.556), helped by the shared word 'debit'; got {got}"
