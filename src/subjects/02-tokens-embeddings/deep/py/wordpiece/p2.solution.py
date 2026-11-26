def wordpiece_ids(text, vocab):
    """Lowercase, split on spaces, and turn each word into its piece IDs.
    A word that cannot be fully matched becomes ONE [UNK], not partial pieces."""
    ids = []
    for word in text.lower().split():
        pieces = longest_match(word, vocab)
        if pieces is None:
            ids.append(vocab["[UNK]"])
        else:
            ids.extend(vocab[p] for p in pieces)
    return ids

print(wordpiece_ids("HuggingFace tokenization", VOCAB))
