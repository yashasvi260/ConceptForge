VOCAB = DATA["vocab"]  # piece -> ID: every real BERT entry these words could match

def longest_match(word, vocab):
    """BERT's WordPiece: take the longest vocabulary piece at the start, then continue with "##" pieces.
    Return the list of pieces, or None if some part of the word matches nothing."""
    pieces, start = [], 0
    while start < len(word):
        end = len(word)
        found = None
        while end > start:
            sub = ("##" if start else "") + word[start:end]
            if sub in vocab:
                found = sub
                break
            end -= 1
        if found is None:
            return None
        pieces.append(found)
        start = end
    return pieces

for w in DATA["words"][:5]:
    print(w, "→", longest_match(w, VOCAB))
