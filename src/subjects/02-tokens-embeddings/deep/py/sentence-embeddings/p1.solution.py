import numpy as np

POOL = DATA["pool"]  # real MiniLM token vectors ([CLS] … [SEP]) and MiniLM's own sentence vector, for two sentences

def mean_pool(token_vectors, mask):
    """Average the token vectors where mask is 1, then scale the result to length 1 (MiniLM's recipe)."""
    X, m = np.asarray(token_vectors, dtype=float), np.asarray(mask, dtype=float)
    mean = (X * m[:, None]).sum(axis=0) / m.sum()
    return mean / np.linalg.norm(mean)

for text, p in POOL.items():
    v = mean_pool(p["vectors"], [1] * len(p["tokens"]))
    official = np.array(p["sentence"]) / np.linalg.norm(p["sentence"])
    print(f"{text:<28} cosine with MiniLM's own sentence vector: {float(v @ official):.5f}")
