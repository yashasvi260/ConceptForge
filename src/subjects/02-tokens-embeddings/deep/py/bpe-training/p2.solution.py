def merge_pair(pair, words):
    """Replace every adjacent occurrence of pair (a, b) with the single symbol a+b, in every word."""
    a, b = pair
    out = {}
    for symbols, freq in words.items():
        merged, i = [], 0
        while i < len(symbols):
            if i + 1 < len(symbols) and symbols[i] == a and symbols[i + 1] == b:
                merged.append(a + b)
                i += 2
            else:
                merged.append(symbols[i])
                i += 1
        out[tuple(merged)] = freq
    return out

words = start_words(DATA["corpus"])
print(merge_pair(("e", "s"), words))
