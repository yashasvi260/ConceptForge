# Worked example for "Long context": GPT-2 small's real loss by how much context it had, where attention's cost
# overtakes the rest of the model (Kaplan et al.'s FLOPs per token), and the cache at long context.
import json

g = DATA["m04"]["gen"]
lc = g["long_context"]
loss = [[f"{b['from']}–{b['to']}" if b["from"] != b["to"] else str(b["from"]), b["count"], b["loss"]] for b in lc["by_context"]]

cost = []
for m in DATA["m04"]["models"]:
    N, Ld = m["nonembedding_params"], m["layers"] * m["d_model"]
    crossover = round(N / Ld)
    share = Ld * m["context"] / (N + Ld * m["context"])
    cost.append([m["name"], N, Ld, crossover, m["context"], round(share, 3)])

ll = next(m for m in DATA["m04"]["models"] if m["name"] == "Llama 3 8B")
per_token = 2 * ll["layers"] * ll["kv_heads"] * (ll["d_model"] // ll["heads"]) * 2
window = 4096
cache = [[n, round(per_token * n / 1e9, 2), round(per_token * min(n, window) / 1e9, 2)] for n in (4096, 8192, 32768, 131072)]

print(json.dumps({
    "GPT-2's loss by how much context it had (Pride and Prejudice, 8 windows of 1,024 tokens)": loss,
    "Where attention's cost overtakes the rest of the model": cost,
    "KV cache for one sequence, Llama 3 8B's shape, 16-bit (GB)": cache,
}))
