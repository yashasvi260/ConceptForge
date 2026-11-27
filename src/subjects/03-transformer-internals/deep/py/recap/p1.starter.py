import numpy as np

def layer_norm(x, g, b, eps=1e-5):
    m = x.mean(-1, keepdims=True)
    return (x - m) / np.sqrt(x.var(-1, keepdims=True) + eps) * g + b

def gelu(x):
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))

def gpt2_block(x, w, H):
    """One GPT-2 block on x (n × d), with weights in GPT-2's layout (every matrix is in × out, used as x @ W):
    w["ln1_g"], w["ln1_b"]; w["attn_w"] (d × 3d) and w["attn_b"] for Q, K, V at once; w["proj_w"], w["proj_b"];
    w["ln2_g"], w["ln2_b"]; w["fc_w"] (d × 4d), w["fc_b"]; w["out_w"] (4d × d), w["out_b"]."""
    n, d = x.shape
    dh = d // H
    # TODO 1: pre-norm attention: q, k, v from layer_norm(x) @ attn_w + attn_b, split into 3 then into H heads
    # TODO 2: causal softmax(q kᵀ / √dh) @ v per head, merge the heads, @ proj_w + proj_b, add to x
    # TODO 3: pre-norm feed-forward: gelu(layer_norm(x) @ fc_w + fc_b) @ out_w + out_b, add to x
    return x

def make_weights(d, H, rng):
    f = 4 * d
    s = lambda *shape: rng.normal(0, 0.1, size=shape)
    return {"ln1_g": 1 + s(d), "ln1_b": s(d), "attn_w": s(d, 3 * d), "attn_b": s(3 * d), "proj_w": s(d, d), "proj_b": s(d),
            "ln2_g": 1 + s(d), "ln2_b": s(d), "fc_w": s(d, f), "fc_b": s(f), "out_w": s(f, d), "out_b": s(d)}

rng = np.random.default_rng(0)
x = rng.normal(size=(6, 32))
print(gpt2_block(x, make_weights(32, 4, rng), 4).shape)
