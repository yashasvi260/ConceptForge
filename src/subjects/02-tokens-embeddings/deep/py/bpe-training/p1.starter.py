from collections import Counter

def start_words(corpus):
    """Each distinct word as a tuple of characters plus the end-of-word marker, with its count."""
    counts = Counter(corpus.split())
    return {tuple(w) + ("</w>",): n for w, n in counts.items()}

def get_pair_counts(words):
    """How often each adjacent pair of symbols occurs, weighted by word frequency. Pairs never cross words."""
    pairs = Counter()
    # TODO: for each word's symbols, add its frequency to every adjacent (a, b) pair
    return pairs

words = start_words(DATA["corpus"])
print(words)
print(get_pair_counts(words).most_common(5))
