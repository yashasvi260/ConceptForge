# Worked example for the recap mini-project: a tiny smoothed bigram model, measured before and after fine-tuning.
import json, math, re

GENERAL = """The cat sat on the mat. The dog sat on the rug. The cat ate the fish.
The dog ate the bone. A bird sat on the tree. The bird ate the seed."""
BANKING = """The bank approved the loan. The customer repaid the loan. The bank froze the card.
The customer reported the card. The bank refunded the payment."""
HELD_OUT = "The bank approved the payment. The customer froze the card."

tok = lambda t: re.findall(r"[a-z']+|[.,!?]", t.lower())
def train(ts):
    c = {}
    for a, b in zip(ts, ts[1:]):
        c.setdefault(a, {}); c[a][b] = c[a].get(b, 0) + 1
    return c
vocab = sorted(set(tok(GENERAL + " " + BANKING + " " + HELD_OUT)))
def prob(c, prev, nxt):
    f = c.get(prev, {}); return (f.get(nxt, 0) + 1) / (sum(f.values()) + len(vocab))
def ppl(c, ts):
    ls = [-math.log(prob(c, a, b)) for a, b in zip(ts, ts[1:])]
    return math.exp(sum(ls) / len(ls))

g = tok(GENERAL)
base = train(g)
tuned = train(g + tok(BANKING))
held = tok(HELD_OUT)
print(json.dumps({
    "The mini-project's model in numbers": [
        ["vocabulary size", len(vocab), len(vocab)],
        ["training tokens", len(g), len(g) + len(tok(BANKING))],
        ["P(cat | the), smoothed", round(prob(base, "the", "cat"), 4), round(prob(tuned, "the", "cat"), 4)],
        ["P(loan | the), smoothed", round(prob(base, "the", "loan"), 4), round(prob(tuned, "the", "loan"), 4)],
        ["perplexity on held-out banking text", round(ppl(base, held), 2), round(ppl(tuned, held), 2)],
    ],
}))
