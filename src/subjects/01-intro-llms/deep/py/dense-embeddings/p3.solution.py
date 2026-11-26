def most_similar_pair():
    """The two different sentences with the highest cosine, as (score, a, b)."""
    names = list(vectors)
    best = (-1.0, None, None)
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            s = cosine(vectors[names[i]], vectors[names[j]])
            if s > best[0]:
                best = (s, names[i], names[j])
    return best

score, a, b = most_similar_pair()
print(round(score, 3), "|", a, "|", b)
