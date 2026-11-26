def decoder_examples(tokens):
    """Every (context, next token) pair a decoder learns from one sequence."""
    return [(tokens[:i], tokens[i]) for i in range(1, len(tokens))]

def masked_lm_example(tokens, positions):
    """An encoder's (BERT) training example: hide the tokens at `positions` with "[MASK]".
    Return (masked tokens, {position: original token})."""
    masked = [("[MASK]" if i in positions else t) for i, t in enumerate(tokens)]
    return masked, {i: tokens[i] for i in positions}

sent = "the cat sat on the mat".split()
for ctx, nxt in decoder_examples(sent):
    print(" ".join(ctx), "->", nxt)
print(masked_lm_example(sent, [2, 5]))
