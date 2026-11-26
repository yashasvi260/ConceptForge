# Worked example for "Static vs contextual": real MiniLM contextual vectors for "bank" in four sentences, and
# for a word repeated in one sentence, compared with what a static table would give (always 1.0 for the same ID).
import json
import numpy as np

bank = DATA["minilm"]["bank"]
names = list(bank)
V = np.array([bank[n] for n in names])
V = V / np.linalg.norm(V, axis=1, keepdims=True)
C = V @ V.T
short = ["approved the loan", "deposited cash", "river bank flooded", "picnic, river bank"]

pool = DATA["minilm"]["pool"]["The bank approved the loan"]
T = np.array(pool["vectors"])
T = T / np.linalg.norm(T, axis=1, keepdims=True)

print(json.dumps({
    "Cosine similarity of the four real bank vectors": [[short[i]] + [round(float(C[i, j]), 3) for j in range(4)] for i in range(4)],
    "Static table vs contextual vectors for the same token": [
        ["the (positions 1 and 4, same sentence)", 1.0, round(float(T[1] @ T[4]), 3)],
        ["bank: approved the loan vs river bank flooded", 1.0, round(float(C[0, 2]), 3)],
        ["bank: approved the loan vs deposited cash", 1.0, round(float(C[0, 1]), 3)],
        ["bank: river bank flooded vs picnic, river bank", 1.0, round(float(C[2, 3]), 3)],
    ],
}))
