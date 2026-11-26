def most_similar_pair():
    """The two different sentences with the highest cosine, as (score, a, b)."""
    names = list(vectors)
    best = (-1.0, None, None)
    # TODO: compare every pair (i < j) and keep the best
    return best

score, a, b = most_similar_pair()
print(round(score, 3), "|", a, "|", b)
