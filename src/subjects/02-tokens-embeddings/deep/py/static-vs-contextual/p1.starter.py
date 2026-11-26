import numpy as np

BANK = DATA["bank"]               # real MiniLM contextual vectors for "bank" in four sentences
NAMES = list(BANK)

def cosine(a, b):
    """Cosine similarity: dot product divided by both lengths (1 = same direction, 0 = unrelated)."""
    # TODO
    return 0.0

def similarity_matrix(vectors):
    """Cosine similarity of every pair of rows."""
    # TODO: normalise each row to length 1, then one matrix product
    return np.zeros((len(vectors), len(vectors)))

M = similarity_matrix(np.array([BANK[n] for n in NAMES]))
for n, row in zip(NAMES, M):
    print(f"{n:<36}", np.round(row, 3))
