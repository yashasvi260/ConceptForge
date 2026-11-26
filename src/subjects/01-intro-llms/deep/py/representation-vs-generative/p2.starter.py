def cos(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

def classify(text):
    """Return (best label, {label: cosine}) by comparing the text's vector with every centroid."""
    v = vectors[text]
    scores = {}  # TODO: cosine of v with each centroid
    best = None  # TODO: the label with the highest score
    return best, scores

for t in ["I can't sign in to my account", "I see a payment I don't recognise", "The movie was excellent"]:
    print(t, "->", classify(t))
