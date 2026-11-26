def rank(query, docs):
    """Score every doc against the query with Bag-of-Words cosine; best first, as [(score, doc), ...]."""
    vocab = build_vocab([query, *docs])
    q = vectorize(query, vocab)
    # TODO: score each doc with cosine(q, vectorize(doc, vocab)); sort high to low
    return []

docs = ["The film was great", "The weather was great", "Interest rates rose today"]
for score, doc in rank("Was the movie good?", docs):
    print(round(score, 3), doc)
