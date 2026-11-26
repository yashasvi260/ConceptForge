import math

def cosine(a, b):
    """cos(a, b) = (a · b) / (|a| × |b|). Return 0.0 if either vector is all zeros."""
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return 0.0 if na == 0 or nb == 0 else dot / (na * nb)

v = {s: vectorize(s, vocab) for s in sentences}
print(round(cosine(v["The film was great"], v["The movie was excellent"]), 3))
print(round(cosine(v["Dog bites man"], v["Man bites dog"]), 3))
