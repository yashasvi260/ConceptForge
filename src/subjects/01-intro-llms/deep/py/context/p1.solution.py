# A toy "static" embedding table: 2 numbers per word (how money-ish, how water-ish).
static = {"bank": [0.5, 0.5], "cash": [1.0, 0.0], "loan": [0.9, 0.1], "river": [0.0, 1.0], "flooded": [0.1, 0.9]}

def contextual(word, neighbours):
    """Context by averaging: the word's vector mixed with its neighbours' vectors (equal weights)."""
    vectors = [static[word]] + [static[n] for n in neighbours]
    return [sum(v[i] for v in vectors) / len(vectors) for i in range(len(vectors[0]))]

print("money bank:", contextual("bank", ["cash", "loan"]))
print("river bank:", contextual("bank", ["river", "flooded"]))
