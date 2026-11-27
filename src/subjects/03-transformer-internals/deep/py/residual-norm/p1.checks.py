import numpy as np
x = np.array([2.0, -1.0, 0.5, 8.0])

def check_small_vector(ns):
    assert np.allclose(ns["layer_norm"](x, 1, 0), [-0.110, -0.988, -0.549, 1.646], atol=1e-3), "LayerNorm([2, -1, 0.5, 8]) = [-0.110, -0.988, -0.549, 1.646]"
    assert np.allclose(ns["rms_norm"](x, 1), [0.481, -0.240, 0.120, 1.923], atol=1e-3), "RMSNorm([2, -1, 0.5, 8]) = [0.481, -0.240, 0.120, 1.923]"

def check_rows_of_a_matrix(ns):
    X = np.random.default_rng(1).normal(3, 5, size=(6, 64))
    Y = ns["layer_norm"](X, 1, 0)
    assert np.allclose(Y.mean(axis=1), 0, atol=1e-9) and np.allclose(Y.std(axis=1), 1, atol=1e-4), "each row (each token) gets mean 0 and std 1"
    Z = ns["rms_norm"](X, 1)
    assert np.allclose(np.sqrt((Z ** 2).mean(axis=1)), 1, atol=1e-4), "RMSNorm gives each row a root mean square of 1"

def check_gain_and_bias(ns):
    g, b = np.full(4, 2.0), np.full(4, 0.5)
    assert np.allclose(ns["layer_norm"](x, g, b), ns["layer_norm"](x, 1, 0) * 2 + 0.5), "the learned gain multiplies and the bias adds, after normalising"
