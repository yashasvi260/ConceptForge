import numpy as np

# DATA["sentences"] maps each sentence to its real 384-number MiniLM vector.
vectors = {s: np.array(v) for s, v in DATA["sentences"].items()}
print(len(vectors), "sentences, each a vector of", len(next(iter(vectors.values()))), "numbers")

def cosine(a, b):
    """Cosine similarity of two NumPy vectors."""
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

print(round(cosine(vectors["The film was great"], vectors["The movie was excellent"]), 3))
