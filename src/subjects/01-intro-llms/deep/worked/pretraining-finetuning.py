# Worked example for "Pre-training, then fine-tuning": a bigram model, before and after extra domain text.
import json

general = "the cat sat on the mat . the dog ate the food . the cat ate the fish .".split()
banking = "the bank approved the loan . the loan was repaid .".split()

def count(tokens, counts=None):
    counts = {k: dict(v) for k, v in (counts or {}).items()}
    for a, b in zip(tokens, tokens[1:]):
        counts.setdefault(a, {})
        counts[a][b] = counts[a].get(b, 0) + 1
    return counts

def probs(counts, prev):
    f = counts[prev]; t = sum(f.values())
    return {k: v / t for k, v in f.items()}

base = count(general)
tuned = count(banking, base)
pb, pt = probs(base, "the"), probs(tuned, "the")
words = list(dict.fromkeys([*pb, *pt]))
print(json.dumps({
    "P(next | “the”) before and after fine-tuning": [[w, round(pb.get(w, 0), 3), round(pt.get(w, 0), 3)] for w in words],
    "sizes": [len(general), len(banking)],
}))
