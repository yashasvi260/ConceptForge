import numpy as np

IDS = DATA["pool"]["The bank approved the loan"]["ids"]  # MiniLM's real IDs: [CLS] the bank approved the loan [SEP]
V, d = 30522, 8                                           # MiniLM's vocabulary; 8 numbers per row to keep it small
E = np.random.default_rng(0).normal(size=(V, d))          # stand-in for the learned table

def lookup(E, ids):
    """Row ids[i] of E for every token: shape (len(ids), d)."""
    # TODO: one line of NumPy indexing
    return np.zeros((len(ids), E.shape[1]))

def one_hot_lookup(E, ids):
    """The same thing as a matrix product: one-hot rows (len(ids) × V) times E (V × d).
    (Build only the len(ids) rows you need: np.eye(V) would be V × V, about 7.5 GB for MiniLM.)"""
    # TODO: one_hot = zeros of shape (len(ids), V); set one_hot[np.arange(len(ids)), ids] = 1; multiply by E
    return np.zeros((len(ids), E.shape[1]))

print(IDS)
print(lookup(E, IDS).shape, np.allclose(lookup(E, IDS), one_hot_lookup(E, IDS)))
