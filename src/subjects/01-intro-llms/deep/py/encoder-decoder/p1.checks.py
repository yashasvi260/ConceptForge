import numpy as np

def check_matches_the_worked_example(ns):
    H = np.array([[1.0, 0.0], [0.0, 1.0], [0.5, 0.5]])
    w, out = ns["cross_attention"](np.array([[0.2, 1.0]]), H)
    assert w is not None, "cross_attention returned None"
    assert np.allclose(np.round(w, 3), [[0.245, 0.431, 0.325]]), f"weights should be [0.245, 0.431, 0.325], got {np.round(w, 3)}"
    assert np.allclose(np.round(out, 3), [[0.407, 0.593]]), f"output should be [0.407, 0.593], got {np.round(out, 3)}"

def check_shapes_follow_decoder_and_encoder(ns):
    rng = np.random.default_rng(0)
    w, out = ns["cross_attention"](rng.normal(size=(2, 8)), rng.normal(size=(5, 8)))
    assert w.shape == (2, 5), f"weights: one row per decoder position, one column per input token: (2, 5), got {w.shape}"
    assert out.shape == (2, 8), f"output: one d-wide vector per decoder position: (2, 8), got {out.shape}"
    assert (w > 0).all(), "no mask in cross-attention: every input token gets some weight"
