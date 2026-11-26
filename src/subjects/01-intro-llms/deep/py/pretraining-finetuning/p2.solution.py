def fine_tune(base, tokens, epochs):
    """Fine-tune by going over the domain text `epochs` times."""
    tuned = base
    for _ in range(epochs):
        tuned = count(tokens, tuned)
    return tuned

for epochs in (1, 5, 20):
    p = probs(fine_tune(base, banking, epochs), "the")
    print(epochs, "epochs:  P(cat | the) =", round(p.get("cat", 0), 3), "  P(loan | the) =", round(p.get("loan", 0), 3))
