import numpy as np
ATTN = np.array(DATA["gpt2"]["sentences"][0]["attn"])

def check_share_excludes_query_zero(ns):
    W = np.tril(np.ones((4, 4))) / np.arange(1, 5)[:, None]
    assert np.isclose(ns["first_token_share"](W), (1/2 + 1/3 + 1/4) / 3), "average W[i, 0] over queries 1 … n−1 only"

def check_counts_real_sinks(ns):
    assert ns["count_sinks"](ATTN) == 104, "104 of GPT-2's 144 heads put more than half their attention on the first token for this sentence"
    assert ns["count_sinks"](ATTN, threshold=0.99) < ns["count_sinks"](ATTN), "a stricter threshold finds fewer heads"
