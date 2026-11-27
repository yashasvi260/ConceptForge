import numpy as np

def repeat_kv(K, n_rep):
    """(kv_heads, n, d_head) → (kv_heads · n_rep, n, d_head): each KV head repeated for its group of query heads,
    so query head h reads KV head h // n_rep."""
    # TODO: np.repeat along axis 0
    return K

K = np.arange(2 * 3 * 4, dtype=float).reshape(2, 3, 4)   # 2 KV heads, 3 tokens, 4 numbers
print(repeat_kv(K, 4).shape)
