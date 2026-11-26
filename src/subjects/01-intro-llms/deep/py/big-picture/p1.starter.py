text = "the cat sat on the mat . the cat ate the fish . the dog sat on the rug ."
tokens = text.split()

def count_bigrams(tokens):
    """Return {previous_token: {next_token: count}} for every neighbouring pair."""
    counts = {}
    # TODO: walk over neighbouring pairs (prev, nxt) and add 1 to counts[prev][nxt].
    # Hint: zip(tokens, tokens[1:]) gives you the pairs.
    return counts

counts = count_bigrams(tokens)
print(counts.get("the"))
