import numpy as np

# Real MiniLM vectors for the token "bank" inside four sentences (384 numbers each).
bank = {s: np.array(v) for s, v in DATA["bank"].items()}
money = ["The bank approved the loan", "I deposited cash at the bank"]
river = ["The river bank flooded", "We had a picnic on the river bank"]

def cos(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

def same_vs_different():
    """Average cosine of 'bank' pairs with the SAME meaning, and pairs with DIFFERENT meanings."""
    same = []       # TODO: the money pair and the river pair
    different = []  # TODO: every (money, river) combination: 4 pairs
    return float(np.mean(same)) if same else 0.0, float(np.mean(different)) if different else 0.0

s, d = same_vs_different()
print(f"same meaning: {s:.3f}   different meaning: {d:.3f}")
