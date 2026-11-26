# Worked example for "The vocabulary": what a vocabulary costs inside the model, and what a bigger one saves.
import json

rows = []
for m in DATA["models"]:
    table = m["vocab"] * m["d_model"]
    copies = 1 if m["tied_embeddings"] else 2  # input table, plus a separate output head when not tied
    rows.append([m["name"], m["vocab"], m["d_model"], table, round(100 * copies * table / m["total_params"], 1)])

langs = DATA["tokens"]["languages"]
sizes = DATA["tokens"]["vocab_sizes"]
cl, o = sum(l["cl100k_base"] for l in langs), sum(l["o200k_base"] for l in langs)

print(json.dumps({
    "Vocabulary size and the embedding table": rows,
    "Doubling the vocabulary: GPT-4 vs GPT-4o on the six sample texts": [
        ["GPT-4 (cl100k_base)", sizes["cl100k_base"], cl],
        ["GPT-4o (o200k_base)", sizes["o200k_base"], o],
    ],
    "saving_pct": round(100 * (cl - o) / cl, 1),
}))
