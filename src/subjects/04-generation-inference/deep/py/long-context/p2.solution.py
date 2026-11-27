import numpy as np

def sliding_window_mask(n, window):
    """True where query i may attend to key j: causal (j <= i) and within the last `window` tokens (i - j < window)."""
    i = np.arange(n)[:, None]
    j = np.arange(n)[None, :]
    return (j <= i) & (i - j < window)

print(sliding_window_mask(6, 3).astype(int))
