import numpy as np

BANK = DATA["bank"]               # real MiniLM contextual vectors for "bank" in four sentences
NAMES = list(BANK)

def cosine(a, b):
    """Cosine similarity: dot product divided by both lengths (1 = same direction, 0 = unrelated)."""
    a, b = np.asarray(a), np.asarray(b)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

def similarity_matrix(vectors):
    """Cosine similarity of every pair of rows."""
    unit = vectors / np.linalg.norm(vectors, axis=1, keepdims=True)
    return unit @ unit.T

M = similarity_matrix(np.array([BANK[n] for n in NAMES]))
for n, row in zip(NAMES, M):
    print(f"{n:<36}", np.round(row, 3))
