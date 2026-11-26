# Worked example for "Representation vs generative": classify with real MiniLM vectors, and price both approaches.
import json, math

S = DATA["minilm"]["sentences"]
cos = lambda a, b: sum(x * y for x, y in zip(a, b)) / math.sqrt(sum(x * x for x in a) * sum(y * y for y in b))
mean = lambda vs: [sum(v[i] for v in vs) / len(vs) for i in range(len(vs[0]))]

labelled = {
    "login": ["How do I reset my password?", "I forgot my login details"],
    "payments": ["My card was charged twice"],
    "movies": ["The film was great"],
}
centroids = {k: mean([S[s] for s in v]) for k, v in labelled.items()}
tests = ["I can't sign in to my account", "I see a payment I don't recognise", "The movie was excellent"]
rows = []
for t in tests:
    sims = {k: round(cos(S[t], c), 3) for k, c in centroids.items()}
    rows.append([t, sims["login"], sims["payments"], sims["movies"], max(sims, key=sims.get)])

enc = 2 * 22_713_216 * 10
dec = 2 * 8_030_261_248 * 62
print(json.dumps({
    "Nearest-centroid classification with MiniLM vectors": rows,
    "Rough compute for one 10-token ticket": [
        ["embed with MiniLM (22.7 M weights, 10 tokens)", f"{enc:.1e}"],
        ["ask an 8 B decoder (60-token prompt + 2-token answer)", f"{dec:.1e}"],
        ["ratio", f"{dec / enc:,.0f}×"],
    ],
}))
