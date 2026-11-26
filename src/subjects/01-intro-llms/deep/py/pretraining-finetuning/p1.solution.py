general = "the cat sat on the mat . the dog ate the food . the cat ate the fish .".split()
banking = "the bank approved the loan . the loan was repaid .".split()

def count(tokens, counts=None):
    """Bigram counts. If `counts` is given, start from a COPY of it and add to it (that's fine-tuning)."""
    new = {k: dict(v) for k, v in (counts or {}).items()}   # copy, so the base model is untouched
    for a, b in zip(tokens, tokens[1:]):
        new.setdefault(a, {})
        new[a][b] = new[a].get(b, 0) + 1
    return new

def probs(counts, prev):
    f = counts.get(prev, {})
    total = sum(f.values())
    return {k: v / total for k, v in f.items()}

base = count(general)          # pre-training
tuned = count(banking, base)   # fine-tuning on a little domain text
print("before:", {k: round(v, 3) for k, v in probs(base, "the").items()})
print("after: ", {k: round(v, 3) for k, v in probs(tuned, "the").items()})
