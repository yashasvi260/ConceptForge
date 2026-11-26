def translate(H, queries, src_words, lexicon):
    """A toy decoder: for each query, attend over the input and translate the source word that got the most weight."""
    out = []
    for q in queries:
        w, _ = cross_attention(q[None, :], H)
        out.append(lexicon[src_words[int(w.argmax())]])
    return out

lexicon = {"the": "le", "cat": "chat", "sleeps": "dort"}
src = ["the", "cat", "sleeps"]
H = np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]])
queries = np.array([[2.0, 0.1, 0.0], [0.1, 2.0, 0.3], [0.0, 0.2, 2.0]])
print(" ".join(translate(H, queries, src, lexicon)))
