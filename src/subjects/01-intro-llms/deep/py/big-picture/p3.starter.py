def generate(counts, start, n):
    """Greedy generation: start from `start`, then n times append the most likely next token."""
    out = [start]
    for _ in range(n):
        # TODO: look at what followed out[-1], pick the most frequent one, append it.
        # Ties: keep the one seen first (max() already does this for a dict).
        pass
    return out

print(" ".join(generate(counts, "the", 7)))
