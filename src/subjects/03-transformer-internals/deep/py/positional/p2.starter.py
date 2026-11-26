import numpy as np

def rope(x, pos):
    """Rotary position embedding: rotate each pair (x[2i], x[2i+1]) by the angle pos · θᵢ, θᵢ = 10000^(−2i/d)."""
    # TODO: theta = pos * 10000.0 ** (-2 * np.arange(d // 2) / d); then rotate the even/odd pairs
    return np.array(x, dtype=float)

q = np.array([0.9, 0.2, -0.4, 0.7])
k = np.array([0.5, -0.8, 0.3, 0.6])
print(round(rope(q, 5) @ rope(k, 2), 4), round(rope(q, 105) @ rope(k, 102), 4))
