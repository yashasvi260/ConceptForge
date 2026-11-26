POOL = DATA["pool"]["The bank approved the loan"]   # real MiniLM output: one contextual vector per token
TOKENS = POOL["tokens"]                              # ['[CLS]', 'the', 'bank', 'approved', 'the', 'loan', '[SEP]']
X = np.array(POOL["vectors"])

def repeated_word_similarity(X, i, j):
    """Cosine of the contextual vectors at positions i and j (a static table would always give 1.0 for the same ID)."""
    # TODO
    return 0.0

def closest_word(X, tokens, i):
    """The other real word (not [CLS] or [SEP], not position i) whose contextual vector is closest to position i's."""
    # TODO
    return ""

print("the vs the:", round(repeated_word_similarity(X, 1, 4), 3))
print("closest to 'bank':", closest_word(X, TOKENS, 2))
