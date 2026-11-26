def train_bpe(corpus, num_merges):
    """Learn num_merges merges: count pairs, merge the most frequent (ties: the pair seen first), repeat."""
    words = start_words(corpus)
    merges = []
    for _ in range(num_merges):
        pairs = get_pair_counts(words)
        if not pairs:
            break
        # TODO: pick the most frequent pair with max(pairs, key=pairs.get), record it, and merge it
    return merges

merges = train_bpe(DATA["corpus"], 10)
for i, (a, b) in enumerate(merges, 1):
    print(i, a, "+", b, "→", a + b)
