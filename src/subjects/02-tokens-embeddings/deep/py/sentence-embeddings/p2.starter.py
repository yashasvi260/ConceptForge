def pad_batch(token_vector_lists, pad_vector):
    """Stack sentences of different lengths into one array (batch × longest × d) and return the attention mask
    (1 for real tokens, 0 for padding). Padded positions are filled with pad_vector: a real model outputs a
    (non-zero) vector at every padded position, so padding is never just zeros by the time you pool."""
    longest = max(len(v) for v in token_vector_lists)
    d = len(token_vector_lists[0][0])
    X = np.tile(np.asarray(pad_vector, dtype=float), (len(token_vector_lists), longest, 1))
    mask = np.zeros((len(token_vector_lists), longest))
    # TODO: copy each sentence's rows into X[i, :n] and set mask[i, :n] = 1
    return X, mask

def naive_pool(X):
    """What NOT to do: average every row, padding included."""
    return mean_pool(X, np.ones(len(X)))

short, long = DATA["pool"]["The bank approved the loan"], DATA["pool"]["I forgot my login details"]
PAD_OUT = np.full(384, 0.1)  # stand-in for the vector a model outputs at a [PAD] position
X, mask = pad_batch([short["vectors"], long["vectors"]], PAD_OUT)
official = np.array(short["sentence"])
print(X.shape, mask.tolist())
print("masked:", round(float(mean_pool(X[0], mask[0]) @ official), 4), " naive:", round(float(naive_pool(X[0]) @ official), 4))
