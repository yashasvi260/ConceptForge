# Record REAL GPT-2 (small) generation data for Module 04's deep lessons and labs. Run with:
#   node scripts/record-m04-generation.mjs
# (runs this file in python:3.12-slim with the pinned torch/transformers and the .cache/hf model cache)
import json, math, os, statistics, time, urllib.request
import torch
import transformers
from transformers import GPT2LMHeadModel, GPT2TokenizerFast

torch.manual_seed(0)
torch.set_num_threads(4)
NAME = "openai-community/gpt2"
tok = GPT2TokenizerFast.from_pretrained(NAME)
model = GPT2LMHeadModel.from_pretrained(NAME, attn_implementation="eager").eval()
cfg = model.config
EOS = tok.eos_token_id
r = lambda x, n=3: round(float(x), n)
piece = lambda i: tok.decode([int(i)])

def last_logits(text):
    ids = tok(text, return_tensors="pt")["input_ids"]
    with torch.no_grad():
        out = model(ids, output_hidden_states=True)
    return ids, out.logits[0, -1].double(), out.hidden_states[-1][0, -1].double()

# ---------------------------------------------------------------- next-token distributions (full vocabulary)
PROMPTS = [
    "The capital of France is",
    "The cat sat on the",
    "Your loan application has been",
    "My favourite thing about weekends is",
]
TEMPS = [round(0.1 * k, 1) for k in range(1, 21)]
TOPKS = [1, 5, 10, 40, 100, 1000, 10000]
TOPPS = [0.5, 0.8, 0.9, 0.95, 0.99]
MINPS = [0.01, 0.05, 0.1, 0.2]

def stats_at(logits, T):
    p = torch.softmax(logits / T, -1)
    sp, _ = torch.sort(p, descending=True)
    cum = torch.cumsum(sp, 0)
    ent = -(p[p > 0] * torch.log2(p[p > 0])).sum()
    return {
        "T": T,
        "lse": r(torch.logsumexp(logits / T, -1), 6),
        "entropy_bits": r(ent),
        "top1": r(sp[0], 4),
        "nucleus90": int((cum < 0.9).sum()) + 1,
    }

dists = []
for text in PROMPTS:
    ids, lg, h = last_logits(text)
    p = torch.softmax(lg, -1)
    sp, si = torch.sort(p, descending=True)
    cum = torch.cumsum(sp, 0)
    dists.append({
        "prompt": text,
        "tokens": [piece(i) for i in ids[0]],
        "top": [{"token": piece(i), "id": int(i), "logit": r(lg[i]), "prob": r(p[i], 5)} for i in si[:40]],
        "lse": r(torch.logsumexp(lg, -1), 6),
        "max_logit": r(lg.max()),
        "min_logit": r(lg.min()),
        "temps": [stats_at(lg, T) for T in TEMPS],
        "tail": {str(k): r(1 - sp[:k].sum(), 5) for k in TOPKS},
        "nucleus": {str(q): int((cum < q).sum()) + 1 for q in TOPPS},
        "minp": {str(m): int((p >= m * sp[0]).sum()) for m in MINPS},
    })

# The LM head on one real vector: GPT-2 ties its output matrix to the token-embedding table.
ids0, lg0, h0 = last_logits(PROMPTS[0])
E = model.transformer.wte.weight.double()
top12 = torch.argsort(lg0, descending=True)[:12]
lm_head = {
    "prompt": PROMPTS[0],
    "tied": bool(model.lm_head.weight.data_ptr() == model.transformer.wte.weight.data_ptr()),
    "vocab": cfg.vocab_size,
    "d_model": cfg.n_embd,
    "h": [r(v, 4) for v in h0.tolist()],
    "rows": [{"token": piece(i), "id": int(i), "logit": r(lg0[i], 4), "e": [r(v, 4) for v in E[i].tolist()]} for i in top12],
    "h_norm": r(h0.norm()),
}

# Every position predicts: the model's guess after each prefix, and the probability it gave the real next token.
SENT = "The bank approved the loan because the customer had a steady income"
ids = tok(SENT, return_tensors="pt")["input_ids"]
with torch.no_grad():
    P = torch.softmax(model(ids).logits[0].double(), -1)
toks = ids[0].tolist()
positions = []
for i in range(len(toks) - 1):
    g = int(P[i].argmax())
    positions.append({"prefix_end": piece(toks[i]), "actual": piece(toks[i + 1]), "p_actual": r(P[i, toks[i + 1]], 4),
                      "guess": piece(g), "p_guess": r(P[i, g], 4)})
nll = [-math.log(p["p_actual"]) for p in positions]

# ---------------------------------------------------------------- decoding: greedy, sampling, beam search
def seq_logprob(prompt_ids, new_ids):
    """Sum of log-probabilities the model gives each generated token (teacher forcing), plus each token's rank."""
    full = torch.cat([prompt_ids, new_ids.unsqueeze(0)], 1)
    with torch.no_grad():
        lp = torch.log_softmax(model(full).logits[0].double(), -1)
    n = prompt_ids.shape[1]
    total, ranks = 0.0, []
    for j, t in enumerate(new_ids.tolist()):
        row = lp[n - 1 + j]
        total += float(row[t])
        ranks.append(int((row > row[t]).sum()) + 1)
    return total, ranks

def generate(prompt, n, **kw):
    ids = tok(prompt, return_tensors="pt")
    with torch.no_grad():
        out = model.generate(**ids, max_new_tokens=n, pad_token_id=EOS, **kw)
    new = out[0, ids["input_ids"].shape[1]:]
    lp, ranks = seq_logprob(ids["input_ids"], new)
    return {"text": tok.decode(new), "tokens": [piece(i) for i in new], "logprob": r(lp), "ranks": ranks}

greedy = {p: generate(p, 40, do_sample=False) for p in ["The cat sat on the", "Your loan application has been"]}
beam = generate("The cat sat on the", 40, do_sample=False, num_beams=5)
# Logit processors that look back at what was written (HF: repetition_penalty divides positive logits and
# multiplies negative ones by the penalty for every token already in the sequence; no_repeat_ngram_size bans repeats).
penalties = {
    "none": greedy["The cat sat on the"],
    "repetition_penalty 1.2": generate("The cat sat on the", 40, do_sample=False, repetition_penalty=1.2),
    "no_repeat_ngram_size 3": generate("The cat sat on the", 40, do_sample=False, no_repeat_ngram_size=3),
}
SAMPLE_PROMPT = "My favourite thing about weekends is"
samples = []
for label, kw in [
    ("T=0.3", {"temperature": 0.3, "top_k": 0, "top_p": 1.0}),
    ("T=0.7", {"temperature": 0.7, "top_k": 0, "top_p": 1.0}),
    ("T=1.0", {"temperature": 1.0, "top_k": 0, "top_p": 1.0}),
    ("T=1.5", {"temperature": 1.5, "top_k": 0, "top_p": 1.0}),
    ("T=1.0, top-k 40", {"temperature": 1.0, "top_k": 40, "top_p": 1.0}),
    ("T=1.0, top-p 0.9", {"temperature": 1.0, "top_k": 0, "top_p": 0.9}),
]:
    for seed in range(3):
        torch.manual_seed(seed)
        s = generate(SAMPLE_PROMPT, 30, do_sample=True, **kw)
        samples.append({"setting": label, "seed": seed, **kw, **s})

# ---------------------------------------------------------------- the generation loop, with and without a KV cache
LOOP_PROMPT = "Your loan application has been"

def loop(prompt, n, use_cache):
    ids = tok(prompt, return_tensors="pt")["input_ids"]
    seq, past, steps, logits_seen = ids, None, [], []
    with torch.no_grad():
        for step in range(n):
            feed = seq if (past is None or not use_cache) else seq[:, -1:]
            t0 = time.perf_counter()
            out = model(feed, past_key_values=past if use_cache else None, use_cache=use_cache)
            ms = (time.perf_counter() - t0) * 1000
            if use_cache:
                past = out.past_key_values
            lg = out.logits[0, -1].double()
            p = torch.softmax(lg, -1)
            nxt = int(lg.argmax())
            logits_seen.append(lg)
            steps.append({"step": step + 1, "fed": int(feed.shape[1]), "context": int(seq.shape[1]), "token": piece(nxt), "prob": r(p[nxt], 4), "ms": r(ms, 1)})
            seq = torch.cat([seq, torch.tensor([[nxt]])], 1)
    return seq[0].tolist(), steps, logits_seen, past

ids_c, steps_c, lg_c, past = loop(LOOP_PROMPT, 20, True)
ids_n, steps_n, lg_n, _ = loop(LOOP_PROMPT, 20, False)
max_diff = max(float((a - b).abs().max()) for a, b in zip(lg_c, lg_n))

def cache_shape(pkv):
    try:
        layer = pkv.layers[0]
        return list(layer.keys.shape), len(pkv.layers)
    except AttributeError:
        return list(pkv[0][0].shape), len(pkv)
shape, n_layers = cache_shape(past)

# Timings: a long prompt (prefill) then decoding with and without the cache. Real, but machine-dependent.
book_path = "/root/.cache/huggingface/pg1342.txt"
if not os.path.exists(book_path):
    # Project Gutenberg's own mirror (gutenberg.org itself refuses scripted downloads); public domain.
    req = urllib.request.Request("https://gutenberg.pglaf.org/cache/epub/1342/pg1342.txt", headers={"User-Agent": "Mozilla/5.0"})
    open(book_path, "wb").write(urllib.request.urlopen(req).read())
book = open(book_path, encoding="utf-8").read()
start = book.index("It is a truth universally acknowledged")
book_ids = tok(book[start:start + 200_000])["input_ids"]

def timed(fn, reps=3):
    best = float("inf")
    for _ in range(reps):
        t0 = time.perf_counter(); fn(); best = min(best, time.perf_counter() - t0)
    return best * 1000

timing = {"cpu_threads": torch.get_num_threads(), "prompt_tokens": 512, "new_tokens": 64}
prompt512 = torch.tensor([book_ids[:512]])
with torch.no_grad():
    timing["prefill_ms"] = r(timed(lambda: model(prompt512, use_cache=True)), 1)
    def decode(use_cache):
        seq, past = prompt512, None
        out = model(seq, use_cache=use_cache)
        past = out.past_key_values if use_cache else None
        nxt = out.logits[:, -1:].argmax(-1)
        per = []
        for _ in range(64):
            seq = torch.cat([seq, nxt], 1)
            t0 = time.perf_counter()
            out = model(nxt if use_cache else seq, past_key_values=past, use_cache=use_cache)
            per.append((time.perf_counter() - t0) * 1000)
            past = out.past_key_values if use_cache else None
            nxt = out.logits[:, -1:].argmax(-1)
        return per
    with_c = decode(True)
    without_c = decode(False)
# Prefill time against prompt length (the whole prompt in one parallel pass).
timing["prefill_by_length"] = []
with torch.no_grad():
    for n in [64, 128, 256, 512, 1024]:
        x = torch.tensor([book_ids[:n]])
        timing["prefill_by_length"].append({"tokens": n, "ms": r(timed(lambda: model(x, use_cache=True)), 1)})
timing["decode_ms_median_cache"] = r(statistics.median(with_c), 2)
timing["decode_ms_median_nocache"] = r(statistics.median(without_c), 2)
timing["decode_total_ms_cache"] = r(sum(with_c), 1)
timing["decode_total_ms_nocache"] = r(sum(without_c), 1)

kv = {
    "prompt": LOOP_PROMPT,
    "same_tokens": ids_c == ids_n,
    "max_logit_diff": float(f"{max_diff:.3g}"),
    "text": tok.decode(ids_c[len(tok(LOOP_PROMPT)['input_ids']):]),
    "steps_cache": steps_c,
    "steps_nocache": steps_n,
    "layer_shape": shape,
    "layers": n_layers,
    "bytes_per_number": 4,
    "timing": timing,
}

# ---------------------------------------------------------------- long context: loss by position, and the 1,024 limit
WIN = cfg.n_positions
buckets = [(1, 1), (2, 4), (5, 16), (17, 64), (65, 256), (257, 1023)]
sums = [0.0] * len(buckets); counts = [0] * len(buckets)
n_windows = 8
for w in range(n_windows):
    chunk = torch.tensor([book_ids[w * WIN:(w + 1) * WIN]])
    with torch.no_grad():
        lp = torch.log_softmax(model(chunk).logits[0].double(), -1)
    tgt = chunk[0, 1:]
    nll_pos = -lp[:-1].gather(1, tgt.unsqueeze(1)).squeeze(1)    # position i predicts token i+1; i = 0 has 1 token of context
    for i, v in enumerate(nll_pos.tolist()):
        ctx = i + 1
        for b, (lo, hi) in enumerate(buckets):
            if lo <= ctx <= hi:
                sums[b] += v; counts[b] += 1
try:
    with torch.no_grad():
        model(torch.tensor([book_ids[:WIN + 1]]))
    over = "no error"
except Exception as e:  # noqa: BLE001
    over = type(e).__name__
long_context = {
    "n_positions": WIN,
    "text": "Pride and Prejudice (Project Gutenberg #1342)",
    "windows": n_windows,
    "by_context": [{"from": lo, "to": hi, "loss": r(s / c), "count": c} for (lo, hi), s, c in zip(buckets, sums, counts)],
    "over_limit_error": over,
}

print(json.dumps({
    "model": NAME,
    "transformers": transformers.__version__,
    "torch": torch.__version__,
    "config": {"vocab": cfg.vocab_size, "d_model": cfg.n_embd, "layers": cfg.n_layer, "heads": cfg.n_head, "n_positions": cfg.n_positions},
    "dists": dists,
    "lm_head": lm_head,
    "positions": {"text": SENT, "rows": positions, "mean_loss": r(sum(nll) / len(nll))},
    "greedy": greedy,
    "beam": beam,
    "penalties": penalties,
    "eos": {"id": EOS, "token": piece(EOS)},
    "sample_prompt": SAMPLE_PROMPT,
    "samples": samples,
    "kv": kv,
    "long_context": long_context,
}))
