def next_token_probs(counts, prev):
    """Turn the counts after `prev` into probabilities that add up to 1."""
    followers = counts[prev]
    # TODO: divide each count by the total number of times `prev` was followed by anything.
    return {}

print(next_token_probs(counts, "the"))
