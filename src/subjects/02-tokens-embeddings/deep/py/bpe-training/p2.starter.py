def merge_pair(pair, words):
    """Replace every adjacent occurrence of pair (a, b) with the single symbol a+b, in every word."""
    a, b = pair
    out = {}
    for symbols, freq in words.items():
        merged = []
        # TODO: walk through symbols; when symbols[i] == a and symbols[i + 1] == b, append a + b and skip both
        out[tuple(merged)] = freq
    return out

words = start_words(DATA["corpus"])
print(merge_pair(("e", "s"), words))
