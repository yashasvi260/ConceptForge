import numpy as np

def sinusoidal(pos, d):
    """The original Transformer's position vector for position `pos`, with d dimensions (d even):
    dimension 2i is sin(pos / 10000^(2i/d)), dimension 2i+1 is cos(pos / 10000^(2i/d))."""
    # TODO: i = np.arange(d); the frequency index for dimension i is i // 2
    return np.zeros(d)

print(np.round(sinusoidal(1, 16)[:6], 3))
