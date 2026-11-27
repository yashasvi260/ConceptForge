import numpy as np
cat = DATA["gen"]["dists"][1]
z = np.array([t["logit"] for t in cat["top"]])

def H(p):
    p = p[p > 0]
    return -(p * np.log2(p)).sum()

def check_temperature_one_is_softmax(ns):
    e = np.exp(z - z.max()); want = e / e.sum()
    assert np.allclose(ns["softmax_t"](z, 1.0), want), "T = 1 leaves the distribution unchanged"

def check_ratios(ns):
    p = ns["softmax_t"](z, 0.5)
    want = np.exp((z[0] - z[1]) / 0.5)
    assert abs(p[0] / p[1] - want) < 1e-6 * want, f"at T = 0.5, ' floor' : ' bed' = e^((l1 - l2) / T) = {want:.3f}"

def check_low_and_high(ns):
    cold, hot = ns["softmax_t"](z, 0.05), ns["softmax_t"](z, 3.0)
    assert cold[0] > 0.9, "a very low temperature puts almost everything on the top token"
    assert H(hot) > H(ns["softmax_t"](z, 1.0)) > H(cold), "higher temperature, flatter distribution (more entropy)"

def check_greedy(ns):
    assert ns["greedy"](z) == 0 and ns["greedy"]([0.1, 2.0, -1.0]) == 1, "greedy picks the highest logit"
