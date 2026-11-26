text = "the cat sat on the mat . the cat ate the fish . the dog sat on the rug ."
tokens = text.split()

def count_bigrams(tokens):
    """Return {previous_token: {next_token: count}} for every neighbouring pair."""
    counts = {}
    for prev, nxt in zip(tokens, tokens[1:]):
        counts.setdefault(prev, {})
        counts[prev][nxt] = counts[prev].get(nxt, 0) + 1
    return counts

counts = count_bigrams(tokens)
print(counts["the"])
