def train(tokens):
    """Bigram counts {prev: {next: count}}."""
    counts = {}
    for a, b in zip(tokens, tokens[1:]):
        counts.setdefault(a, {})
        counts[a][b] = counts[a].get(b, 0) + 1
    return counts

def prob(counts, vocab, prev, nxt):
    """P(nxt | prev) with add-one smoothing: (count + 1) / (total after prev + vocabulary size).
    Never 0, so an unseen pair is unlikely but possible (fixing step 1's zero problem)."""
    # TODO: use counts.get(prev, {}) so an unseen prev works too
    return 0.0

tokens = tokenize(GENERAL)
vocab = sorted(set(tokenize(GENERAL + " " + BANKING + " " + HELD_OUT)))
counts = train(tokens)
print(len(vocab), "tokens in the vocabulary")
print("P(cat | the) =", round(prob(counts, vocab, "the", "cat"), 4))
print("P(loan | the) =", round(prob(counts, vocab, "the", "loan"), 4), "(never seen, but not zero)")
