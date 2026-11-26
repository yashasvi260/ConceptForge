def nearest(query, k=3):
    """The k sentences most similar to `query` (excluding itself), as [(score, sentence), ...], best first."""
    q = vectors[query]
    scored = [(cosine(q, vec), s) for s, vec in vectors.items() if s != query]
    return sorted(scored, reverse=True)[:k]

for score, s in nearest("How do I reset my password?"):
    print(round(score, 3), s)
