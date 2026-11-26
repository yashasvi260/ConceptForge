# Worked example for "From token ID to vector": the embedding table's size for real models, and why a lookup
# is the same as multiplying a one-hot vector by the table.
import json
import numpy as np

d_minilm = len(DATA["minilm"]["pool"]["The bank approved the loan"]["vectors"][0])  # 384, read from real vectors
v_bert = DATA["tokens"]["vocab_sizes"]["bert_base_uncased"]
models = [("MiniLM (all-MiniLM-L6-v2)", v_bert, d_minilm)] + [(m["name"], m["vocab"], m["d_model"]) for m in DATA["models"]]
sizes = [[n, v, d, v * d, round(v * d * 4 / 1e6, 1), round(v * d * 2 / 1e6, 1)] for n, v, d in models]

E = np.arange(12, dtype=float).reshape(4, 3)  # a toy table: 4 tokens, 3 numbers each
ids = [2, 0, 2]
one_hot = np.eye(4)[ids]
print(json.dumps({
    "Embedding table sizes": sizes,
    "A lookup is a one-hot row times the table": [[i, str(one_hot[k].astype(int).tolist()), str((one_hot[k] @ E).tolist()), str(E[i].tolist())] for k, i in enumerate(ids)],
}))
