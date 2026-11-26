import numpy as np

IDS = DATA["pool"]["The bank approved the loan"]["ids"]  # MiniLM's real IDs: [CLS] the bank approved the loan [SEP]
V, d = 30522, 8                                           # MiniLM's vocabulary; 8 numbers per row to keep it small
E = np.random.default_rng(0).normal(size=(V, d))          # stand-in for the learned table

def lookup(E, ids):
    """Row ids[i] of E for every token: shape (len(ids), d)."""
    return E[ids]

def one_hot_lookup(E, ids):
    """The same thing as a matrix product: one-hot rows (len(ids) × V) times E (V × d).
    (Build only the len(ids) rows you need: np.eye(V) would be V × V, about 7.5 GB for MiniLM.)"""
    one_hot = np.zeros((len(ids), E.shape[0]))
    one_hot[np.arange(len(ids)), ids] = 1
    return one_hot @ E

print(IDS)
print(lookup(E, IDS).shape, np.allclose(lookup(E, IDS), one_hot_lookup(E, IDS)))
