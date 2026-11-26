def decoder_examples(tokens):
    """Every (context, next token) pair a decoder learns from one sequence."""
    # TODO: for i in 1 .. len(tokens) - 1: (tokens[:i], tokens[i])
    return []

def masked_lm_example(tokens, positions):
    """An encoder's (BERT) training example: hide the tokens at `positions` with "[MASK]".
    Return (masked tokens, {position: original token})."""
    # TODO
    return tokens, {}

sent = "the cat sat on the mat".split()
for ctx, nxt in decoder_examples(sent):
    print(" ".join(ctx), "->", nxt)
print(masked_lm_example(sent, [2, 5]))
