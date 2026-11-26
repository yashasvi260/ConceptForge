import numpy as np

def sinusoidal(pos, d):
    """The original Transformer's position vector for position `pos`, with d dimensions (d even):
    dimension 2i is sin(pos / 10000^(2i/d)), dimension 2i+1 is cos(pos / 10000^(2i/d))."""
    i = np.arange(d)
    angle = pos / 10000 ** (2 * (i // 2) / d)
    return np.where(i % 2 == 0, np.sin(angle), np.cos(angle))

print(np.round(sinusoidal(1, 16)[:6], 3))
