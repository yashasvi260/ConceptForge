import numpy as np
weekend = DATA["gen"]["dists"][3]                    # "My favourite thing about weekends is": GPT-2's top 40
z = np.array([t["logit"] for t in weekend["top"]])

def top_k_filter(z, k):
    """Keep the k largest logits; set every other logit to -inf so softmax gives it probability 0."""
    z = np.asarray(z, dtype=float)
    out = np.full_like(z, -np.inf)
    keep = np.argsort(-z)[:k]
    out[keep] = z[keep]
    return out

def softmax(z):
    z = np.asarray(z, dtype=float)
    e = np.exp(z - z.max())
    return e / e.sum()

print(softmax(top_k_filter(z, 3)).round(3)[:5])
