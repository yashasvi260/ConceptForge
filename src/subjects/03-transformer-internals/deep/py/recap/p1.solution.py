import numpy as np

def layer_norm(x, g, b, eps=1e-5):
    m = x.mean(-1, keepdims=True)
    return (x - m) / np.sqrt(x.var(-1, keepdims=True) + eps) * g + b

def gelu(x):
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))

def gpt2_block(x, w, H):
    """One GPT-2 block on x (n × d), with weights in GPT-2's layout (every matrix is in × out, used as x @ W)."""
    n, d = x.shape
    dh = d // H
    qkv = layer_norm(x, w["ln1_g"], w["ln1_b"]) @ w["attn_w"] + w["attn_b"]
    q, k, v = (t.reshape(n, H, dh).transpose(1, 0, 2) for t in np.split(qkv, 3, axis=-1))
    s = q @ k.transpose(0, 2, 1) / np.sqrt(dh) + np.triu(np.full((n, n), -np.inf), 1)
    a = np.exp(s - s.max(-1, keepdims=True))
    a /= a.sum(-1, keepdims=True)
    x = x + (a @ v).transpose(1, 0, 2).reshape(n, d) @ w["proj_w"] + w["proj_b"]
    h = gelu(layer_norm(x, w["ln2_g"], w["ln2_b"]) @ w["fc_w"] + w["fc_b"])
    return x + h @ w["out_w"] + w["out_b"]

def make_weights(d, H, rng):
    f = 4 * d
    s = lambda *shape: rng.normal(0, 0.1, size=shape)
    return {"ln1_g": 1 + s(d), "ln1_b": s(d), "attn_w": s(d, 3 * d), "attn_b": s(3 * d), "proj_w": s(d, d), "proj_b": s(d),
            "ln2_g": 1 + s(d), "ln2_b": s(d), "fc_w": s(d, f), "fc_b": s(f), "out_w": s(f, d), "out_b": s(d)}

rng = np.random.default_rng(0)
x = rng.normal(size=(6, 32))
print(gpt2_block(x, make_weights(32, 4, rng), 4).shape)
