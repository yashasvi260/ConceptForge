def corpus_loglik(texts, vocab):
    """Total log-probability of the texts, each split its best way, under this vocabulary."""
    global VOCAB
    saved, VOCAB = VOCAB, vocab
    try:
        return sum(viterbi(t)[1] for t in texts)
    finally:
        VOCAB = saved

def removal_loss(piece, texts):
    """How much the corpus log-likelihood drops if this piece is removed from the vocabulary.
    Unigram training repeatedly drops the pieces with the smallest loss."""
    smaller = {p: lp for p, lp in VOCAB.items() if p != piece}
    return corpus_loglik(texts, VOCAB) - corpus_loglik(texts, smaller)

TEXTS = ["hello world", "the cat sat on the mat", "unbelievable", "tokenization"]
for p in ["▁the", "▁hello", "ization", "▁unbeliev", "ld"]:
    print(f"{p:<10} {removal_loss(p, TEXTS):8.3f}")
