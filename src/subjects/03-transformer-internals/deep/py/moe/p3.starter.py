import numpy as np

def switch_balance_loss(probs, chosen, n_experts):
    """The Switch Transformer's auxiliary loss: n_experts · Σᵢ fᵢ · Pᵢ, where fᵢ is the share of tokens sent to
    expert i and Pᵢ is the router's average probability for expert i. Equals 1.0 when routing is perfectly even."""
    # TODO: np.bincount(chosen, minlength=n_experts) / len(chosen) gives every fᵢ
    return 0.0

even = np.full((8, 4), 0.25)
print(switch_balance_loss(even, np.array([0, 1, 2, 3, 0, 1, 2, 3]), 4))
