import math

def viterbi(text):
    """The most probable segmentation of text, and its log-probability.
    best[i] = best score for the first i characters; back[i] = where its last piece starts."""
    s = normalize(text)
    best = [0.0] + [-math.inf] * len(s)
    back = [0] * (len(s) + 1)
    for end in range(1, len(s) + 1):
        for start in range(end):
            piece = s[start:end]
            lp = VOCAB.get(piece, UNK if end - start == 1 else None)  # unknown single chars are allowed
            if lp is not None and best[start] + lp > best[end]:
                best[end], back[end] = best[start] + lp, start
    pieces, end = [], len(s)
    while end > 0:
        pieces.insert(0, s[back[end]:end])
        end = back[end] if back[end] < end else end - 1
    return pieces, best[-1]

for t in ["hello world", "unbelievable", "tokenization"]:
    print(t, viterbi(t))
