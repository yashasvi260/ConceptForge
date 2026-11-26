def check_greedy_text_from_the(ns):
    got = " ".join(ns["generate"](ns["counts"], "the", 7))
    assert got == "the cat sat on the cat sat on", f"expected 'the cat sat on the cat sat on', got {got!r}"

def check_generates_n_new_tokens(ns):
    assert len(ns["generate"](ns["counts"], "dog", 3)) == 4, "start token plus 3 new tokens should give 4 tokens"
