MERGES = [tuple(m) for m in DATA["merges"]]

def check_lowest_uses_pieces_from_training(ns):
    got = ns["encode_word"]("lowest", MERGES)
    assert got == ["low", "est</w>"], f"'lowest' was never seen, but low and est</w> were: ['low', 'est</w>'], got {got}"

def check_partial_matches(ns):
    got = (ns["encode_word"]("newer", MERGES), ns["encode_word"]("slowly", MERGES))
    want = (["new", "e", "r", "</w>"], ["s", "low", "l", "y", "</w>"])
    assert got == want, f"newer → {want[0]}, slowly → {want[1]}; got {got}"

def check_merge_order_matters(ns):
    got = ns["encode_word"]("lowest", list(reversed(MERGES)))
    assert got == ["lo", "w", "es", "t", "</w>"], f"with the merges reversed, 'lowest' becomes ['lo', 'w', 'es', 't', '</w>'], got {got}"
