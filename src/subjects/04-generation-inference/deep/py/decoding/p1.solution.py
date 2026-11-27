import numpy as np
cat = DATA["gen"]["dists"][1]                      # "The cat sat on the": GPT-2's 40 most likely next tokens
z = np.array([t["logit"] for t in cat["top"]])

def softmax_t(z, T):
    """Divide the logits by the temperature T, then softmax (subtract the max first)."""
    s = np.asarray(z, dtype=float) / T
    e = np.exp(s - s.max())
    return e / e.sum()

def greedy(z):
    """The index of the single most likely token."""
    return int(np.argmax(z))

print(softmax_t(z, 0.5)[:3].round(3), greedy(z))
