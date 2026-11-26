import numpy as np
S = DATA["search"]
D, Q = np.array(S["doc_vectors"]), np.array(S["query_vectors"])

def check_finds_the_answer_without_shared_words(ns):
    got = ns["search"](Q[2], D, 1)
    assert got and got[0][1] == 4, f"'transfer funds to another country' → 'How do I send money abroad?' (index 4), got {got}"

def check_returns_k_results_best_first(ns):
    got = ns["search"](Q[0], D, 3)
    assert [i for _, i in got] == [0, 1, 8], f"for 'I can't sign in to my account' the top 3 are documents [0, 1, 8], got {[i for _, i in got]}"
    assert got[0][0] >= got[1][0] >= got[2][0], "scores must be in descending order"
