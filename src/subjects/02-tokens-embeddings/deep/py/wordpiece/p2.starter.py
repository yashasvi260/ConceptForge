def wordpiece_ids(text, vocab):
    """Lowercase, split on spaces, and turn each word into its piece IDs.
    A word that cannot be fully matched becomes ONE [UNK], not partial pieces."""
    ids = []
    for word in text.lower().split():
        pieces = longest_match(word, vocab)
        # TODO: extend ids with the pieces' IDs, or append vocab["[UNK]"] if pieces is None
    return ids

print(wordpiece_ids("HuggingFace tokenization", VOCAB))
