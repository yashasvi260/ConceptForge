# Worked example for "Context changes meaning": real MiniLM token vectors for "bank", and a toy context mix.
import json, math

B = DATA["minilm"]["bank"]
names = list(B)
cos = lambda a, b: sum(x * y for x, y in zip(a, b)) / math.sqrt(sum(x * x for x in a) * sum(y * y for y in b))
short = {"The bank approved the loan": "approved the loan", "I deposited cash at the bank": "deposited cash",
         "The river bank flooded": "river … flooded", "We had a picnic on the river bank": "picnic … river"}

# Toy: static 2-number vectors (money-ness, water-ness); "bank" sits in the middle.
static = {"bank": [0.5, 0.5], "cash": [1.0, 0.0], "loan": [0.9, 0.1], "river": [0.0, 1.0], "flooded": [0.1, 0.9]}
def contextual(word, neighbours):
    vs = [static[word]] + [static[n] for n in neighbours]
    return [round(sum(v[i] for v in vs) / len(vs), 3) for i in range(2)]
money = contextual("bank", ["cash", "loan"])
river = contextual("bank", ["river", "flooded"])

print(json.dumps({
    "Cosine between MiniLM's vectors for “bank” in four sentences": [
        [short[a], *[round(cos(B[a], B[b]), 3) for b in names]] for a in names
    ],
    "Toy: averaging “bank” with its neighbours": [
        ["bank (static, any sentence)", *static["bank"], round(cos(static["bank"], static["cash"]), 3), round(cos(static["bank"], static["river"]), 3)],
        ["bank + cash + loan", *money, round(cos(money, static["cash"]), 3), round(cos(money, static["river"]), 3)],
        ["bank + river + flooded", *river, round(cos(river, static["cash"]), 3), round(cos(river, static["river"]), 3)],
    ],
}))
