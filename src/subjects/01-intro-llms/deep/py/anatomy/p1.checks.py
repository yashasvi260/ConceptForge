import numpy as np

def check_embed_returns_the_right_rows(ns):
    E = np.arange(12.0).reshape(6, 2)
    got = ns["embed"](E, [5, 0, 5])
    assert got is not None, "embed returned None"
    assert np.shape(got) == (3, 2), f"shape should be (3, 2), got {np.shape(got)}"
    assert np.allclose(got, [[10, 11], [0, 1], [10, 11]]), "rows should be E[5], E[0], E[5]"

def check_softmax_values(ns):
    got = ns["softmax"](np.array([1.0, 2.0, 3.0]))
    assert got is not None, "softmax returned None"
    assert np.allclose(got, [0.09003057, 0.24472847, 0.66524096]), f"softmax([1, 2, 3]) should be about [0.090, 0.245, 0.665], got {got}"

def check_softmax_rows_add_up_to_1_and_never_overflow(ns):
    got = ns["softmax"](np.array([[1000.0, 1001.0], [-5.0, 5.0]]))
    assert np.all(np.isfinite(got)), "got inf or nan: subtract the row max before exp()"
    assert np.allclose(got.sum(axis=-1), 1), "each row must add up to 1"
