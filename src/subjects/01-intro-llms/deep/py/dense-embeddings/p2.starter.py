def nearest(query, k=3):
    """The k sentences most similar to `query` (excluding itself), as [(score, sentence), ...], best first."""
    q = vectors[query]
    # TODO: score every other sentence with cosine(q, vec), sort high to low, keep k
    return []

for score, s in nearest("How do I reset my password?"):
    print(round(score, 3), s)
