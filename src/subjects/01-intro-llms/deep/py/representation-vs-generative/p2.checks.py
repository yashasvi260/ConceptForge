def check_classifies_three_unseen_sentences(ns):
    want = {"I can't sign in to my account": "login", "I see a payment I don't recognise": "payments", "The movie was excellent": "movies"}
    got = {t: ns["classify"](t)[0] for t in want}
    assert got == want, f"expected {want}, got {got}"

def check_scores_match_the_worked_example(ns):
    _, s = ns["classify"]("I see a payment I don't recognise")
    assert round(s.get("payments", 0), 3) == 0.395, f"cosine with the payments centroid should be 0.395, got {s.get('payments')}"
