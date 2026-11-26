VOCAB = DATA["vocab"]                      # piece -> log-probability (the Unigram view's illustrative vocabulary)
UNK = DATA["unknown_char_logprob"]         # score for a single character missing from the vocabulary

def normalize(text):
    """SentencePiece style: collapse spaces, then mark every word start with ▁ (so 'hello world' → '▁hello▁world')."""
    # TODO
    return text

def score(pieces):
    """Log-probability of a segmentation: the sum of its pieces' log-probabilities (unknown pieces score UNK)."""
    # TODO
    return 0.0

def pick_best(candidates):
    """The candidate segmentation with the highest score."""
    return max(candidates, key=score)

print(normalize("hello   world"))
print(score(["▁hello", "▁world"]), score(["▁hell", "o", "▁world"]))
