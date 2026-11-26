import numpy as np
ATTN = np.array(DATA["gpt2"]["sentences"][0]["attn"])

def check_mask_hides_the_future(ns):
    W = ns["causal_softmax"](np.zeros((4, 4)))
    assert np.allclose(W, [[1, 0, 0, 0], [1/2, 1/2, 0, 0], [1/3, 1/3, 1/3, 0], [1/4, 1/4, 1/4, 1/4]]), "equal scores: token i spreads its weight evenly over the i + 1 tokens it can see"

def check_rows_sum_to_one(ns):
    W = ns["causal_softmax"](np.random.default_rng(2).normal(size=(6, 6)) * 5)
    assert np.allclose(W.sum(axis=1), 1) and np.all(np.triu(W, k=1) == 0), "every row sums to 1, with zeros above the diagonal"

def check_real_gpt2_is_causal(ns):
    assert all(ns["is_causal"](ATTN[l, h]) for l in range(12) for h in range(12)), "all 144 of GPT-2's real heads give exactly 0 to future tokens"
    leaky = np.tril(np.ones((3, 3))) + np.triu(np.full((3, 3), 0.1), k=1)
    assert ns["is_causal"](leaky) is False, "a matrix with weight above the diagonal is not causal"
