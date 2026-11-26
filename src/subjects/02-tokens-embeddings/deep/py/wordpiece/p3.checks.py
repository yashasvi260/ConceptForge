def check_bpe_picks_the_most_frequent_pair(ns):
    bpe, _ = ns["best_pairs"](DATA["corpus"])
    assert bpe == ("e", "s"), f"BPE merges the most frequent pair, ('e', 's') with 9: got {bpe}"

def check_wordpiece_picks_rare_parts_that_stick_together(ns):
    _, wp = ns["best_pairs"](DATA["corpus"])
    assert wp == ("i", "d"), f"'i d' occurs 3 times and i, d each occur only 3 times: 3 / (3 × 3) = 0.333 is the top score; got {wp}"
