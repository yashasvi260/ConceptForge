def rank_of(query_vec, D, gold):
    """Position (1 = first) of the correct document in the full ranking."""
    # TODO: rank all documents with search(query_vec, D, len(D)) and find gold
    return len(D)

def evaluate(ranks):
    """hit@1, hit@3 and mean reciprocal rank (MRR) from a list of ranks."""
    # TODO: hit@k = share of ranks <= k; MRR = average of 1 / rank
    return 0.0, 0.0, 0.0

ranks = [rank_of(qv, D, g) for qv, g in zip(Q, GOLD)]
print("ranks:", ranks)
print("hit@1 %.3f  hit@3 %.3f  MRR %.3f" % evaluate(ranks))
