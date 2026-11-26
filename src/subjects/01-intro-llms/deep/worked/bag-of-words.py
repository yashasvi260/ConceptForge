# Worked example for "Bag-of-Words": vocabulary, count vectors, cosine similarity.
import json, math, re

sentences = ["The film was great", "The movie was excellent", "Dog bites man", "Man bites dog"]
words = lambda s: re.findall(r"[a-z0-9']+", s.lower())

vocab = []
for s in sentences:
    for w in words(s):
        if w not in vocab:
            vocab.append(w)
vec = lambda s: [words(s).count(w) for w in vocab]
cos = lambda a, b: sum(x * y for x, y in zip(a, b)) / math.sqrt(sum(x * x for x in a) * sum(y * y for y in b))

pairs = [(0, 1), (2, 3), (0, 2)]
print(json.dumps({
    "Each sentence as counts over the shared vocabulary": [[s, *vec(s)] for s in sentences],
    "Cosine similarity of the count vectors": [
        [sentences[i], sentences[j], sum(x * y for x, y in zip(vec(sentences[i]), vec(sentences[j]))), round(cos(vec(sentences[i]), vec(sentences[j])), 3)]
        for i, j in pairs
    ],
    "vocab": vocab,
}))
