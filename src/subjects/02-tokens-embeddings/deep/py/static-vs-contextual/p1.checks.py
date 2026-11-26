import numpy as np
B = DATA["bank"]
N = list(B)

def check_cosine_of_two_river_banks(ns):
    got = ns["cosine"](B[N[2]], B[N[3]])
    assert abs(got - 0.902) < 1e-3, f"the two river sentences' bank vectors: 0.902, got {got}"

def check_cosine_ignores_length(ns):
    a = np.array(B[N[0]])
    assert abs(ns["cosine"](a, 3 * a) - 1) < 1e-9, "scaling a vector must not change its cosine with itself (1.0)"

def check_matrix(ns):
    got = ns["similarity_matrix"](np.array([B[n] for n in N]))
    assert got.shape == (4, 4) and np.allclose(np.diag(got), 1), "a 4 × 4 matrix with 1.0 on the diagonal"
    assert abs(got[0, 1] - 0.806) < 1e-3 and abs(got[0, 2] - 0.826) < 1e-3, f"loan vs cash 0.806, loan vs river 0.826; got {got[0, 1]:.3f}, {got[0, 2]:.3f}"
