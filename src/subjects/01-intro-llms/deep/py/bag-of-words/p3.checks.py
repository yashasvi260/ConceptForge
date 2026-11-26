DOCS = ["The film was great", "The weather was great", "Interest rates rose today"]

def check_ranks_best_first(ns):
    got = ns["rank"]("rates today", DOCS)
    assert got and got[0][1] == "Interest rates rose today", f"'rates today' should rank 'Interest rates rose today' first, got {got[:1]}"
    scores = [s for s, _ in got]
    assert scores == sorted(scores, reverse=True), "scores must go from high to low"

def check_shows_the_limitation(ns):
    got = dict((d, s) for s, d in ns["rank"]("Was the movie good?", DOCS))
    assert abs(got["The film was great"] - got["The weather was great"]) < 1e-9, "Bag-of-Words gives the film review and the weather report the same score: it only sees shared words ('the', 'was')"
