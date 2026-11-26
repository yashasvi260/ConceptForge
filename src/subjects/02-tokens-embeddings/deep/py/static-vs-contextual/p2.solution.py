SENSE = ["money", "money", "river", "river"]  # the sense of "bank" in each of the four sentences, in order

def nearest_other(M, i):
    """Index of the sentence (other than i) whose bank vector is most similar to sentence i's."""
    return max((j for j in range(len(M)) if j != i), key=lambda j: M[i, j])

def within_and_across(M, senses):
    """Mean similarity of pairs with the SAME sense, and of pairs with DIFFERENT senses (each pair once)."""
    same, diff = [], []
    for i in range(len(M)):
        for j in range(i + 1, len(M)):
            (same if senses[i] == senses[j] else diff).append(M[i, j])
    return float(np.mean(same)) if same else 0.0, float(np.mean(diff)) if diff else 0.0

M = similarity_matrix(np.array([BANK[n] for n in NAMES]))
for i, n in enumerate(NAMES):
    print(f"{n:<36} nearest: {NAMES[nearest_other(M, i)]}")
print("same sense %.3f, different sense %.3f" % within_and_across(M, SENSE))
