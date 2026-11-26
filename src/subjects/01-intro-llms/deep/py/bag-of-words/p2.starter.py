import math

def cosine(a, b):
    """cos(a, b) = (a · b) / (|a| × |b|). Return 0.0 if either vector is all zeros."""
    # TODO 1: dot product: sum of a[i] * b[i]
    # TODO 2: lengths: square root of the sum of squares
    return 0.0

v = {s: vectorize(s, vocab) for s in sentences}
print(round(cosine(v["The film was great"], v["The movie was excellent"]), 3))
print(round(cosine(v["Dog bites man"], v["Man bites dog"]), 3))
