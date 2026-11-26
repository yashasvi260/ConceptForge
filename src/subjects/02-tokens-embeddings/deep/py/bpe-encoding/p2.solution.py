def encode_by_rank(word, merges):
    """GPT-2's way: repeatedly merge the adjacent pair whose merge was learned earliest (lowest rank)."""
    rank = {pair: i for i, pair in enumerate(merges)}
    symbols = list(word) + ["</w>"]
    while len(symbols) > 1:
        pairs = list(zip(symbols, symbols[1:]))
        best = min(pairs, key=lambda p: rank.get(p, float("inf")))
        if best not in rank:
            break
        symbols = apply_merge(symbols, best)
    return symbols

for w in ["lowest", "newest", "wider"]:
    print(w, encode_by_rank(w, MERGES), encode_word(w, MERGES))
