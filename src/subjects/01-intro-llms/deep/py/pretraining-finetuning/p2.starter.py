def fine_tune(base, tokens, epochs):
    """Fine-tune by going over the domain text `epochs` times."""
    tuned = base
    # TODO: repeat `tuned = count(tokens, tuned)` epochs times
    return tuned

for epochs in (1, 5, 20):
    p = probs(fine_tune(base, banking, epochs), "the")
    print(epochs, "epochs:  P(cat | the) =", round(p.get("cat", 0), 3), "  P(loan | the) =", round(p.get("loan", 0), 3))
