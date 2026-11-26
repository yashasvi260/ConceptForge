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
    bpe = max(pair, key=pair.get)
    wp = max(pair, key=lambda p: pair[p] / (sym[p[0]] * sym[p[1]]))
    return bpe, wp

print(best_pairs(DATA["corpus"]))
