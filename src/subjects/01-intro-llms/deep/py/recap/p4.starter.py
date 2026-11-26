def perplexity(counts, vocab, tokens):
    """exp(average cross-entropy) over the text's bigrams. Lower = the model is less surprised."""
    losses = []
    # TODO: for each neighbouring pair (a, b): losses.append(-math.log(prob(counts, vocab, a, b)))
    return math.exp(sum(losses) / len(losses)) if losses else float("inf")

held = tokenize(HELD_OUT)
before = perplexity(counts, vocab, held)
tuned = train(tokens + tokenize(BANKING))   # fine-tune: the same counting on extra banking text
after = perplexity(tuned, vocab, held)
print(f"perplexity on unseen banking text: before {before:.2f}, after fine-tuning {after:.2f}")
