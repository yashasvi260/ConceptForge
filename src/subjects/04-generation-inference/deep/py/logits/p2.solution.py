import numpy as np

def softmax(z):
    """Probabilities from logits, safe for very large or very negative logits."""
    z = np.asarray(z, dtype=float)
    e = np.exp(z - z.max())
    return e / e.sum()

def log_softmax(z):
    """Log-probabilities from logits, without ever computing a probability that could round to 0."""
    z = np.asarray(z, dtype=float)
    s = z - z.max()
    return s - np.log(np.exp(s).sum())

print(softmax([1000.0, 999.0]), log_softmax([0.0, -1000.0]))
