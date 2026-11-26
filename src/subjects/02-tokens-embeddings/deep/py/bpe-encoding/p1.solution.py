MERGES = [tuple(m) for m in DATA["merges"]]  # the ten merges learned in step 3, in order

def apply_merge(symbols, pair):
    """Glue every adjacent occurrence of pair into one symbol, left to right."""
    a, b = pair
    out, i = [], 0
    while i < len(symbols):
        if i + 1 < len(symbols) and symbols[i] == a and symbols[i + 1] == b:
            out.append(a + b)
            i += 2
        else:
            out.append(symbols[i])
            i += 1
    return out

def encode_word(word, merges):
    """Split into characters + </w>, then apply every merge, in the order it was learned."""
    symbols = list(word) + ["</w>"]
    for pair in merges:
        symbols = apply_merge(symbols, pair)
    return symbols

for w in ["lowest", "newer", "slowly"]:
    print(w, "→", encode_word(w, MERGES))
