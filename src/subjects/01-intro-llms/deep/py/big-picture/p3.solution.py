def generate(counts, start, n):
    """Greedy generation: start from `start`, then n times append the most likely next token."""
    out = [start]
    for _ in range(n):
        followers = counts[out[-1]]
        out.append(max(followers, key=followers.get))
    return out

print(" ".join(generate(counts, "the", 7)))
