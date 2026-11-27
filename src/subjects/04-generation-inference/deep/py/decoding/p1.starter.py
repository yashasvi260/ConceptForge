import numpy as np
cat = DATA["gen"]["dists"][1]                      # "The cat sat on the": GPT-2's 40 most likely next tokens
z = np.array([t["logit"] for t in cat["top"]])

def softmax_t(z, T):
    """Divide the logits by the temperature T, then softmax (subtract the max first)."""
    # TODO
    return np.full(len(z), 1 / len(z))

def greedy(z):
    """The index of the single most likely token."""
    # TODO
    return 0

print(softmax_t(z, 0.5)[:3].round(3), greedy(z))
