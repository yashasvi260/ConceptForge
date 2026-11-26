def rank_of(query_vec, D, gold):
    """Position (1 = first) of the correct document in the full ranking."""
    order = [i for _, i in search(query_vec, D, len(D))]
    return order.index(gold) + 1

def evaluate(ranks):
    """hit@1, hit@3 and mean reciprocal rank (MRR) from a list of ranks."""
    n = len(ranks)
    return sum(r <= 1 for r in ranks) / n, sum(r <= 3 for r in ranks) / n, sum(1 / r for r in ranks) / n

ranks = [rank_of(qv, D, g) for qv, g in zip(Q, GOLD)]
print("ranks:", ranks)
print("hit@1 %.3f  hit@3 %.3f  MRR %.3f" % evaluate(ranks))
