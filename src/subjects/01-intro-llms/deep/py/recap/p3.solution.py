import math, random

def generate(counts, vocab, start, n, temperature=1.0, seed=0):
    """Generate n tokens after `start`. temperature 0 = greedy; otherwise sample from p ** (1 / temperature)."""
    rng = random.Random(seed)
    out = [start]
    for _ in range(n):
        p = [prob(counts, vocab, out[-1], w) for w in vocab]
        if temperature == 0:
            out.append(vocab[p.index(max(p))])
        else:
            weights = [x ** (1 / temperature) for x in p]
            out.append(rng.choices(vocab, weights)[0])
    return out

print("greedy:", " ".join(generate(counts, vocab, "the", 8, temperature=0)))
print("T=0.5: ", " ".join(generate(counts, vocab, "the", 8, temperature=0.5, seed=1)))
print("T=1.5: ", " ".join(generate(counts, vocab, "the", 8, temperature=1.5, seed=1)))
