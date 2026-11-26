SENSE = ["money", "money", "river", "river"]  # the sense of "bank" in each of the four sentences, in order

def nearest_other(M, i):
    """Index of the sentence (other than i) whose bank vector is most similar to sentence i's."""
    # TODO
    return i

def within_and_across(M, senses):
    """Mean similarity of pairs with the SAME sense, and of pairs with DIFFERENT senses (each pair once)."""
    same, diff = [], []
    # TODO: loop over pairs i < j and append M[i, j] to the right list
    return float(np.mean(same)) if same else 0.0, float(np.mean(diff)) if diff else 0.0

M = similarity_matrix(np.array([BANK[n] for n in NAMES]))
for i, n in enumerate(NAMES):
    print(f"{n:<36} nearest: {NAMES[nearest_other(M, i)]}")
print("same sense %.3f, different sense %.3f" % within_and_across(M, SENSE))
