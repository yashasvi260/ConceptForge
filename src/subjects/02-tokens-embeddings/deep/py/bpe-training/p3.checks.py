WANT = [("e", "s"), ("es", "t"), ("est", "</w>"), ("l", "o"), ("lo", "w"),
        ("n", "e"), ("ne", "w"), ("new", "est</w>"), ("low", "</w>"), ("w", "i")]

def check_learns_the_paper_merges_in_order(ns):
    got = ns["train_bpe"](DATA["corpus"], 10)
    assert got == WANT, f"the ten merges should be {WANT}, got {got}"

def check_vocabulary_grows_by_one_per_merge(ns):
    merges = ns["train_bpe"](DATA["corpus"], 10)
    start = {s for w in ns["start_words"](DATA["corpus"]) for s in w}
    assert len(start) + len(merges) == 21, f"11 starting symbols + 10 merges = 21 entries, got {len(start)} + {len(merges)}"

def check_stops_when_every_word_is_one_symbol(ns):
    got = ns["train_bpe"]("ab ab", 50)
    assert got == [("a", "b"), ("ab", "</w>")], f"'ab' needs only 2 merges, then there are no pairs left; got {got}"
