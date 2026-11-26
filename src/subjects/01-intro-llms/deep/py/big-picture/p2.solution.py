def next_token_probs(counts, prev):
    """Turn the counts after `prev` into probabilities that add up to 1."""
    followers = counts[prev]
    total = sum(followers.values())
    return {tok: c / total for tok, c in followers.items()}

print(next_token_probs(counts, "the"))
