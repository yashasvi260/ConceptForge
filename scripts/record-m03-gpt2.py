# Record REAL GPT-2 (small) internals for Module 03's deep lessons and labs. Run with:
#   node scripts/record-m03-gpt2.mjs
# (runs this file in python:3.12-slim with the pinned torch/transformers and the .cache/hf model cache)
import json, math, sys
import torch
import transformers
from transformers import GPT2LMHeadModel, GPT2Model, GPT2TokenizerFast

torch.manual_seed(0)
NAME = "openai-community/gpt2"
tok = GPT2TokenizerFast.from_pretrained(NAME)
model = GPT2Model.from_pretrained(NAME, attn_implementation="eager").eval()
cfg = model.config
r = lambda x, n=3: round(float(x), n)

SENTENCES = [
    "The bank approved the loan because the customer had a steady income",
    "We had a picnic on the river bank and watched the boats go by",
    "The cat sat on the mat because it was tired",
]
# A wider set for per-head statistics (the same three plus five more, all plain English).
STATS = SENTENCES + [
    "My card was charged twice for the same purchase last week",
    "Interest rates rose again today, and mortgage payments will follow",
    "She opened the letter, read it twice, and smiled",
    "How do I reset my password if I no longer have the old phone",
    "The meeting was moved to Thursday because the room was booked",
]

def run(text):
    ids = tok(text, return_tensors="pt")
    with torch.no_grad():
        out = model(**ids, output_attentions=True, output_hidden_states=True)
    pieces = [tok.decode([i]) for i in ids["input_ids"][0].tolist()]
    return ids, pieces, out

sentences = []
for t in SENTENCES:
    ids, pieces, out = run(t)
    attn = [[[[r(v) for v in row] for row in head] for head in layer[0].tolist()] for layer in out.attentions]
    sentences.append({"text": t, "tokens": pieces, "ids": ids["input_ids"][0].tolist(), "attn": attn})

# Per-head behaviour, averaged over every query position i >= 1 of every STATS sentence.
L, H = cfg.n_layer, cfg.n_head
prev = [[0.0] * H for _ in range(L)]
first = [[0.0] * H for _ in range(L)]
self_ = [[0.0] * H for _ in range(L)]
count = 0
for t in STATS:
    _, _, out = run(t)
    for l, a in enumerate(out.attentions):
        a = a[0]  # heads × n × n
        n = a.shape[-1]
        for h in range(H):
            prev[l][h] += sum(a[h, i, i - 1].item() for i in range(1, n))
            first[l][h] += sum(a[h, i, 0].item() for i in range(1, n))
            self_[l][h] += sum(a[h, i, i].item() for i in range(1, n))
    count += a.shape[-1] - 1
head_stats = {k: [[r(v / count) for v in row] for row in m] for k, m in [("previous", prev), ("first", first), ("self", self_)]}

# The residual stream: vector length of each position after the embedding (layer 0) and after every block.
_, pieces, out = run(SENTENCES[0])
norms = [[r(h[0, i].norm().item(), 1) for i in range(len(pieces))] for h in out.hidden_states]

# LayerNorm on one real vector: the input to block 0's first LayerNorm (embedding + position) for "bank".
x = out.hidden_states[0][0, 2]
ln = model.h[0].ln_1
y = ln(x)
z = (x - x.mean()) / torch.sqrt(x.var(unbiased=False) + ln.eps)
layernorm = {
    "token": pieces[2], "d": cfg.n_embd,
    "before": {"mean": r(x.mean(), 4), "std": r(x.std(unbiased=False), 4)},
    "normalised": {"mean": r(z.mean(), 4), "std": r(z.std(unbiased=False), 4)},
    "after_gain_bias": {"mean": r(y.mean(), 4), "std": r(y.std(unbiased=False), 4)},
    "first8_before": [r(v, 4) for v in x[:8].tolist()],
    "first8_after": [r(v, 4) for v in y[:8].tolist()],
}

# Learned position vectors: average cosine similarity between positions k apart (over all valid pairs).
wpe = model.wpe.weight.detach()
unit = wpe / wpe.norm(dim=1, keepdim=True)
pos_sim = {}
for k in [1, 2, 4, 8, 16, 64, 256, 512]:
    pos_sim[str(k)] = r((unit[:-k] * unit[k:]).sum(dim=1).mean(), 3)

# Feed-forward: share of the 3,072 hidden units that GELU leaves clearly active (> 0.1), per layer, on SENTENCES[0].
acts = {}
hooks = [blk.mlp.act.register_forward_hook(lambda m, i, o, l=l: acts.__setitem__(l, o.detach())) for l, blk in enumerate(model.h)]
run(SENTENCES[0])
for h_ in hooks:
    h_.remove()
ffn_active = [r((acts[l] > 0.1).float().mean(), 3) for l in range(L)]
ffn_negative = [r((acts[l] < 0).float().mean(), 3) for l in range(L)]

# Head ablation: switch off one head at a time (zero its slice of the input to the output projection c_proj)
# and measure how much the average next-token loss over the STATS sentences rises.
lm = GPT2LMHeadModel.from_pretrained(NAME).eval()
enc = [tok(t, return_tensors="pt") for t in STATS]
def avg_loss():
    with torch.no_grad():
        return sum(lm(**e, labels=e["input_ids"]).loss.item() for e in enc) / len(enc)
dh = cfg.n_embd // H
off = {"layer": None, "head": None}
def pre(module, args, l):
    if off["layer"] != l:
        return None
    x = args[0].clone()
    x[..., off["head"] * dh:(off["head"] + 1) * dh] = 0
    return (x,)
hooks = [blk.attn.c_proj.register_forward_pre_hook(lambda m, a, l=l: pre(m, a, l)) for l, blk in enumerate(lm.transformer.h)]
base = avg_loss()
ablation = []
for l in range(L):
    row = []
    for h in range(H):
        off.update(layer=l, head=h)
        row.append(r(avg_loss() - base, 4))
    ablation.append(row)
off.update(layer=None, head=None)
for h_ in hooks:
    h_.remove()

json.dump({
    "model": NAME, "transformers": transformers.__version__, "torch": torch.__version__,
    "config": {"layers": L, "heads": H, "d_model": cfg.n_embd, "d_head": cfg.n_embd // H, "ffn": 4 * cfg.n_embd, "context": cfg.n_positions, "vocab": cfg.vocab_size},
    "sentences": sentences, "head_stats": head_stats, "head_stats_sentences": STATS,
    "residual_norms": {"text": SENTENCES[0], "tokens": pieces, "norms": norms},
    "layernorm": layernorm, "position_similarity": pos_sim,
    "ffn": {"text": SENTENCES[0], "active_share": ffn_active, "negative_share": ffn_negative},
    "head_ablation": {"base_loss": r(base, 4), "loss_increase": ablation, "sentences": STATS},
}, sys.stdout, separators=(",", ":"))
