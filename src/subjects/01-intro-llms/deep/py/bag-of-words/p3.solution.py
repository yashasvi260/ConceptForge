def rank(query, docs):
    """Score every doc against the query with Bag-of-Words cosine; best first, as [(score, doc), ...]."""
    vocab = build_vocab([query, *docs])
    q = vectorize(query, vocab)
    scored = [(cosine(q, vectorize(d, vocab)), d) for d in docs]
    return sorted(scored, key=lambda t: t[0], reverse=True)

docs = ["The film was great", "The weather was great", "Interest rates rose today"]
for score, doc in rank("Was the movie good?", docs):
    print(round(score, 3), doc)
