S = DATA["search"]

def check_keyword_ranks(ns):
    got = [ns["keyword_rank"](q, S["docs"], g) for q, g in zip(S["queries"], S["answers"])]
    assert got == [3, 5, 5, 1, 2, 2], f"expected keyword ranks [3, 5, 5, 1, 2, 2], got {got}"

def check_embeddings_beat_keywords(ns):
    kw = [ns["keyword_rank"](q, S["docs"], g) for q, g in zip(S["queries"], S["answers"])]
    _, _, mrr = ns["evaluate"](kw)
    assert abs(mrr - 0.4556) < 1e-3, f"keyword MRR ≈ 0.456 against 0.917 for embeddings, got {mrr:.4f}"
