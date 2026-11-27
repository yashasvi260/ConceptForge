# Worked example for the recap: one real GPT-2 small generation step from the final vector to a token, with Ollama's
# default sampling settings, and the module's key measurements, all from the recording.
import json, math

g = DATA["m04"]["gen"]
d = g["dists"][0]                                   # "The capital of France is"
lm = g["lm_head"]
T, K, TOP_P = 0.8, 40, 0.9
lse = next(t["lse"] for t in d["temps"] if t["T"] == T)
z = [t["logit"] / T for t in d["top"][:K]]
full = [math.exp(v - lse) for v in z]               # probabilities over all 50,257 tokens at T = 0.8
m = max(z)
p = [math.exp(v - m) for v in z]; s = sum(p); p = [x / s for x in p]
cum, n = 0.0, 0
for x in p:
    n += 1; cum += x
    if cum >= TOP_P - 1e-12:
        break
final = p[0] / sum(p[:n])
norm = math.sqrt(sum(v * v for v in lm["h"]))
step = [
    ["the final vector h", f"{len(lm['h'])} numbers, length {norm:.1f}"],
    ["logits: h · every row of the tied output matrix", f"{g['config']['vocab']:,} scores; top {d['top'][0]['token']!r} at {d['top'][0]['logit']}"],
    ["softmax at temperature 0.8, whole vocabulary", f"{d['top'][0]['token']!r} {100 * full[0]:.1f}%"],
    ["top-k 40", f"40 tokens holding {100 * sum(full):.1f}%, renormalised"],
    ["top-p 0.9 on what's left", f"{n} tokens"],
    ["draw one token", f"{d['top'][0]['token']!r} with probability {100 * final:.1f}%"],
]

pen = {k: v for k, v in g["penalties"].items()}
ranks = lambda setting: max(r for s in g["samples"] if s["setting"] == setting for r in s["ranks"])
kv = g["kv"]
lc = g["long_context"]["by_context"]
numbers = [
    ["GPT-2's perplexity on the bank sentence (step 1)", f"{math.exp(g['positions']['mean_loss']):.1f}"],
    ["worst rank picked in 90 tokens: pure sampling at T = 1 vs top-k 40 (steps 2–3)", f"{ranks('T=1.0'):,} vs {ranks('T=1.0, top-k 40')}"],
    ["tokens covering 90%: weekends vs France (step 3)", f"{g['dists'][3]['nucleus']['0.9']} vs {d['nucleus']['0.9']:,}"],
    ["prefill per prompt token vs one decode step, ms (step 4)", f"{kv['timing']['prefill_by_length'][3]['ms'] / 512:.2f} vs {kv['timing']['decode_ms_median_cache']}"],
    ["tokens fed in a 20-step loop: cache vs none (step 5)", f"{sum(x['fed'] for x in kv['steps_cache'])} vs {sum(x['fed'] for x in kv['steps_nocache'])}"],
    ["largest logit difference, cache vs none (step 5)", f"{kv['max_logit_diff']}"],
    ["loss with 2–4 vs 257–1,023 tokens of context (step 6)", f"{lc[1]['loss']} vs {lc[5]['loss']}"],
]

print(json.dumps({
    "One real step: \"The capital of France is\" with Ollama's defaults": step,
    "Module 04 in seven measurements (GPT-2 small)": numbers,
}))
