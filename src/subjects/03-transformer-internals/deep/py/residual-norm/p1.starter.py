import numpy as np

def layer_norm(x, gain, bias, eps=1e-5):
    """Over the last axis: subtract the mean, divide by √(variance + eps), then × gain + bias."""
    # TODO
    return np.asarray(x, dtype=float)

def rms_norm(x, gain, eps=1e-6):
    """Over the last axis: divide by √(mean of squares + eps), then × gain. No mean, no bias."""
    # TODO
    return np.asarray(x, dtype=float)

x = np.array([2.0, -1.0, 0.5, 8.0])
print(np.round(layer_norm(x, 1, 0), 3), np.round(rms_norm(x, 1), 3))
