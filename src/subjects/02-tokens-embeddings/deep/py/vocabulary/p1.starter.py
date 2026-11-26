from collections import Counter

def build_vocab(texts, specials=("<pad>", "<unk>")):
    """Special tokens first, then every word (lowercased, split on spaces), most frequent first, ties A→Z."""
    counts = Counter(w for t in texts for w in t.lower().split())
    # TODO: sort counts.items() by (-count, word) and append the words after the specials
    return list(specials)

def encode(text, vocab):
    """Words → IDs (positions in vocab); unknown words get the ID of <unk>."""
    index = {tok: i for i, tok in enumerate(vocab)}
    # TODO
    return []

def decode(ids, vocab):
    """IDs → words, joined with spaces."""
    # TODO
    return ""

vocab = build_vocab(["the cat sat on the mat", "the dog sat on the log"])
print(vocab)
print(encode("the cat sat on the rug", vocab))
print(decode(encode("the dog sat", vocab), vocab))
