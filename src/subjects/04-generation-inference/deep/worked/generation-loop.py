# Worked example for "The generation loop": GPT-2 small's real loop on one prompt, step by step (with the KV
# cache, so only the newest token is fed after the first step), prefill timings, and penalties on a greedy loop.
import json

g = DATA["m04"]["gen"]
steps = [[s["step"], s["fed"], s["context"], repr(s["token"]), s["prob"]] for s in g["kv"]["steps_cache"][:8]]

t = g["kv"]["timing"]
prefill = [[p["tokens"], p["ms"], round(p["ms"] / p["tokens"], 2)] for p in t["prefill_by_length"]]
prefill.append(["1 (one decode step, 512 tokens of context)", t["decode_ms_median_cache"], t["decode_ms_median_cache"]])

def repeated(tokens, n=4):
    seen, out = {}, set()
    for i in range(len(tokens) - n + 1):
        key = tuple(tokens[i:i + n])
        if key in seen and seen[key] + n <= i:
            out.update(range(i, i + n))
        elif key not in seen:
            seen[key] = i
    return len(out)

pen = []
for name, c in g["penalties"].items():
    tail = c["text"].replace("\n", " ")[-50:]
    tail = tail[tail.index(" ") + 1:].lstrip()                      # start at a word boundary
    pen.append([name, "…" + tail, repeated(c["tokens"]), c["logprob"]])

print(json.dumps({
    "The loop, step by step (\"Your loan application has been\", greedy)": steps,
    "Prefill time against prompt length (GPT-2 small, CPU, 4 threads)": prefill,
    "Penalties on GPT-2's greedy loop (\"The cat sat on the\", 40 tokens)": pen,
}))
