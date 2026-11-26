import re

def words(text):
    """Lowercase and split into words (letters, digits and apostrophes)."""
    return re.findall(r"[a-z0-9']+", text.lower())

def build_vocab(sentences):
    """Every distinct word, in the order first seen."""
    vocab = []
    for s in sentences:
        for w in words(s):
            if w not in vocab:
                vocab.append(w)
    return vocab

def vectorize(sentence, vocab):
    """One count per vocabulary word: how many times it appears in the sentence."""
    return [words(sentence).count(w) for w in vocab]

sentences = ["The film was great", "The movie was excellent", "Dog bites man", "Man bites dog"]
vocab = build_vocab(sentences)
print(vocab)
for s in sentences:
    print(f"{s:<26}", vectorize(s, vocab))
