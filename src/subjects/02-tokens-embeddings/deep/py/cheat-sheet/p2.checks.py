import numpy as np
S = DATA["search"]
D, Q = np.array(S["doc_vectors"]), np.array(S["query_vectors"])

def check_ranks_of_the_six_queries(ns):
    got = [ns["rank_of"](qv, D, g) for qv, g in zip(Q, S["answers"])]
    assert got == [2, 1, 1, 1, 1, 1], f"only 'I can't sign in' misses: its labelled answer comes 2nd (after 'reset my password'); got {got}"

def check_metrics(ns):
    h1, h3, mrr = ns["evaluate"]([2, 1, 1, 1, 1, 1])
    assert abs(h1 - 5 / 6) < 1e-9 and h3 == 1 and abs(mrr - 5.5 / 6) < 1e-9, f"hit@1 = 5/6, hit@3 = 1, MRR = (5 + 1/2)/6 = 0.917; got {(h1, h3, mrr)}"
