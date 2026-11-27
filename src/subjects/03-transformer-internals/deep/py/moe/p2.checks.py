import numpy as np
scores = np.array([1.2, -0.3, 2.1, 0.4, -1.0, 1.9, 0.0, -0.5])

def check_route(ns):
    top, w = ns["route"](scores, 2)
    assert list(top) == [2, 5], f"experts 2 and 5 have the two highest scores (2.1 and 1.9), got {list(top)}"
    assert np.allclose(w, [0.55, 0.45], atol=1e-3), f"softmax over (2.1, 1.9) gives 0.550 and 0.450, got {np.round(w, 3)}"

def check_only_chosen_experts_run(ns):
    r = np.random.default_rng(8)
    X, Wr = r.normal(size=(5, 6)), r.normal(size=(6, 4))
    mats = r.normal(size=(4, 6, 6))
    calls = [0, 0, 0, 0]
    def make(j):
        def f(x):
            calls[j] += 1
            return x @ mats[j]
        return f
    out = ns["moe_layer"](X, [make(j) for j in range(4)], Wr, 1)
    assert sum(calls) == 5, f"with k = 1, each of the 5 tokens runs exactly one expert (ran {sum(calls)})"
    best = np.argmax(X @ Wr, axis=1)
    assert np.allclose(out, [X[i] @ mats[best[i]] for i in range(5)]), "with k = 1 the output is the top expert's output, weight 1"

def check_all_experts_is_a_soft_mixture(ns):
    r = np.random.default_rng(9)
    X, Wr = r.normal(size=(3, 4)), r.normal(size=(4, 3))
    mats = r.normal(size=(3, 4, 4))
    experts = [lambda x, M=M: x @ M for M in mats]
    S = X @ Wr
    P = np.exp(S - S.max(axis=1, keepdims=True)); P /= P.sum(axis=1, keepdims=True)
    want = np.array([sum(P[i, j] * X[i] @ mats[j] for j in range(3)) for i in range(3)])
    assert np.allclose(ns["moe_layer"](X, experts, Wr, 3), want), "with k = all experts, it's a full softmax-weighted mixture"
