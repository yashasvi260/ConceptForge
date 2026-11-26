from collections import Counter

def best_pairs(corpus):
    """The first pair BPE would merge (highest count) and the first WordPiece would merge
    (highest count(ab) / (count(a) × count(b))). Words are characters + </w>, weighted by word frequency."""
    words = Counter(corpus.split())
    sym, pair = Counter(), Counter()
    for w, n in words.items():
        s = list(w) + ["</w>"]
        for x in s:
            sym[x] += n
        for a, b in zip(s, s[1:]):
            pair[(a, b)] += n
    # TODO: bpe = the pair with the highest count; wp = the pair with the highest score
    bpe, wp = None, None
    return bpe, wp

print(best_pairs(DATA["corpus"]))
