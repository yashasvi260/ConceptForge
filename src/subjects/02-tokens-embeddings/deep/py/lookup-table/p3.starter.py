import numpy as np

def table_gradient(V, ids, grad_rows):
    """Training adjusts the table through its gradient. Each looked-up row receives the gradient of its position;
    a token that appears twice receives the SUM of both. Every other row gets zero.
    grad_rows: array of shape (len(ids), d). Returns an array of shape (V, d)."""
    G = np.zeros((V, grad_rows.shape[1]))
    # TODO: np.add.at(G, ids, grad_rows) adds correctly even when ids repeat (G[ids] += … does not)
    return G

ids = DATA["pool"]["The bank approved the loan"]["ids"]
g = np.ones((len(ids), 4))
G = table_gradient(30522, ids, g)
print("rows changed:", int((np.abs(G).sum(axis=1) > 0).sum()), "of", G.shape[0])
print("row for 'the' (ID 1996):", G[1996])
