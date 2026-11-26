from collections import Counter

def build_vocab(texts, specials=("<pad>", "<unk>")):
    """Special tokens first, then every word (lowercased, split on spaces), most frequent first, ties A→Z."""
    counts = Counter(w for t in texts for w in t.lower().split())
    words = [w for w, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))]
    return list(specials) + words

def encode(text, vocab):
    """Words → IDs (positions in vocab); unknown words get the ID of <unk>."""
    index = {tok: i for i, tok in enumerate(vocab)}
    return [index.get(w, index["<unk>"]) for w in text.lower().split()]

def decode(ids, vocab):
    """IDs → words, joined with spaces."""
    return " ".join(vocab[i] for i in ids)

vocab = build_vocab(["the cat sat on the mat", "the dog sat on the log"])
print(vocab)
print(encode("the cat sat on the rug", vocab))
print(decode(encode("the dog sat", vocab), vocab))
