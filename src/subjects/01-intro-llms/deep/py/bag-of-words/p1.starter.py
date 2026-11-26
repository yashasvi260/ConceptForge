import re

def words(text):
    """Lowercase and split into words (letters, digits and apostrophes)."""
    return re.findall(r"[a-z0-9']+", text.lower())

def build_vocab(sentences):
    """Every distinct word, in the order first seen."""
    vocab = []
    # TODO: loop over sentences and their words; append words you haven't seen yet
    return vocab

def vectorize(sentence, vocab):
    """One count per vocabulary word: how many times it appears in the sentence."""
    # TODO: one list comprehension using words(sentence).count(w)
    return []

sentences = ["The film was great", "The movie was excellent", "Dog bites man", "Man bites dog"]
vocab = build_vocab(sentences)
print(vocab)
for s in sentences:
    print(f"{s:<26}", vectorize(s, vocab))
