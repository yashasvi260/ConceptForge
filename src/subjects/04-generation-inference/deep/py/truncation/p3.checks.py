import numpy as np
D = DATA["gen"]["dists"]

def check_real_min_p(ns):
    for d in D:
        probs = np.array([t["prob"] for t in d["top"]])
        for m in ("0.05", "0.1", "0.2"):
            got = int(ns["min_p_mask"](probs, float(m)).sum())
            assert got == d["minp"][m], f"{d['prompt']!r}, min_p {m}: GPT-2 keeps {d['minp'][m]} tokens, got {got}"

def freq(ns, z, n=6000, **kw):
    rng = np.random.default_rng(3)
    draws = [ns["sample_chain"](z, rng, **kw) for _ in range(n)]
    return np.bincount(draws, minlength=len(z)) / n

def check_chain(ns):
    z = [3.0, 2.0, 1.0, 0.0]
    assert np.all(freq(ns, z, 2000, top_k=1)[1:] == 0), "top-k 1 always picks the top token"
    f = freq(ns, z, top_k=2)
    assert f[2] == 0 and f[3] == 0 and abs(f[0] - 0.731) < 0.03, f"top-k 2 renormalises the top two: 73% / 27%, got {f.round(2).tolist()}"
    f = freq(ns, z, top_p=0.9)
    assert f[3] == 0 and f[2] > 0, f"top-p 0.9 on softmax([3,2,1,0]) = [.64,.24,.09,.03] keeps three tokens, got {f.round(2).tolist()}"
    f = freq(ns, z, min_p=0.2)
    assert f[2] == 0 and f[3] == 0, "min-p 0.2 cuts tokens below 0.2 × 0.64 = 0.13"

def check_order(ns):
    f = freq(ns, [2.0, 1.0, 0.0], temperature=2.0, top_p=0.6)
    assert f[1] > 0.2 and f[2] == 0, (
        "temperature comes first: at T = 2 the probabilities are [.51, .31, .19], so top-p 0.6 keeps two tokens "
        f"(applied before temperature it would keep only the first); got {f.round(2).tolist()}"
    )
