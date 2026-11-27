import numpy as np

def rope_angles(pos, d_head, base):
    """RoPE's rotation angle for each of the d_head / 2 pairs at position pos: pos · base^(-2i / d_head)."""
    i = np.arange(d_head // 2)
    return pos * base ** (-2 * i / d_head)

def interpolate(pos, train_len, target_len):
    """Position interpolation (Chen et al. 2023): squeeze target_len positions into the trained range."""
    return pos * train_len / target_len

# Llama 3: head width 128, base 500,000, trained on 8,192 tokens
print(rope_angles(8191, 128, 500000)[-1], rope_angles(interpolate(32767, 8192, 32768), 128, 500000)[-1])
