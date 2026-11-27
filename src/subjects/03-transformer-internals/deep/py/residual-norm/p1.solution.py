import numpy as np

def layer_norm(x, gain, bias, eps=1e-5):
    """Over the last axis: subtract the mean, divide by √(variance + eps), then × gain + bias."""
    x = np.asarray(x, dtype=float)
    mean = x.mean(axis=-1, keepdims=True)
    var = x.var(axis=-1, keepdims=True)
    return (x - mean) / np.sqrt(var + eps) * gain + bias

def rms_norm(x, gain, eps=1e-6):
    """Over the last axis: divide by √(mean of squares + eps), then × gain. No mean, no bias."""
    x = np.asarray(x, dtype=float)
    return x / np.sqrt((x ** 2).mean(axis=-1, keepdims=True) + eps) * gain

x = np.array([2.0, -1.0, 0.5, 8.0])
print(np.round(layer_norm(x, 1, 0), 3), np.round(rms_norm(x, 1), 3))
