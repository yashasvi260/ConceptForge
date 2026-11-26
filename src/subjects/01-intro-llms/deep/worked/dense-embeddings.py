# Worked example for "Dense embeddings": real all-MiniLM-L6-v2 sentence vectors (384 numbers each).
import json, math, re

S = DATA["minilm"]["sentences"]
cos = lambda a, b: sum(x * y for x, y in zip(a, b)) / math.sqrt(sum(x * x for x in a) * sum(y * y for y in b))

def bow(a, b):
    w = lambda s: re.findall(r"[a-z0-9']+", s.lower())
    vocab = list(dict.fromkeys(w(a) + w(b)))
    va, vb = [w(a).count(t) for t in vocab], [w(b).count(t) for t in vocab]
    return round(cos(va, vb), 3)

pairs = [
    ("The film was great", "The movie was excellent"),
    ("How do I reset my password?", "I forgot my login details"),
    ("My card was charged twice", "I see a payment I don't recognise"),
    ("The film was great", "Interest rates rose today"),
    ("Dog bites man", "Man bites dog"),
]
v = S["The film was great"]
print(json.dumps({
    "The first 6 of 384 numbers for “The film was great”": [[i + 1, x] for i, x in enumerate(v[:6])],
    "Bag-of-Words vs dense embedding similarity": [[a, b, bow(a, b), round(cos(S[a], S[b]), 3)] for a, b in pairs],
    "length": round(math.sqrt(sum(x * x for x in v)), 3),
    "dims": len(v),
}))
