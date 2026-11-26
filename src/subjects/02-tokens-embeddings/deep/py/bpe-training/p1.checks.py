def words(ns):
    return ns["start_words"](DATA["corpus"])

def check_es_appears_nine_times(ns):
    got = ns["get_pair_counts"](words(ns))[("e", "s")]
    assert got == 9, f"'e s' is in newest (×6) and widest (×3): 9, got {got}"

def check_counts_are_weighted_by_word_frequency(ns):
    got = ns["get_pair_counts"](words(ns))[("l", "o")]
    assert got == 7, f"'l o' is in low (×5) and lower (×2): 7, got {got}"

def check_pairs_never_cross_words(ns):
    pairs = ns["get_pair_counts"]({("a", "</w>"): 1, ("b", "</w>"): 1})
    assert ("</w>", "b") not in pairs, "pairs must stay inside a word: '</w> b' should never be counted"
    assert dict(pairs) == {("a", "</w>"): 1, ("b", "</w>"): 1}, f"expected only the two in-word pairs, got {dict(pairs)}"
