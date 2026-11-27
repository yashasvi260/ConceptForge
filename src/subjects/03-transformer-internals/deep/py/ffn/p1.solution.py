import numpy as np

def gelu(x):
    """GELU, the tanh approximation GPT-2 uses: 0.5·x·(1 + tanh(√(2/π)·(x + 0.044715·x³)))."""
    x = np.asarray(x, dtype=float)
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))

def silu(x):
    """SiLU (Swish₁): x · sigmoid(x)."""
    x = np.asarray(x, dtype=float)
    return x / (1 + np.exp(-x))

xs = np.array([-3.0, -1.0, 0.0, 1.0, 3.0])
print(np.round(gelu(xs), 3), np.round(silu(xs), 3))
