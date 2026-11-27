# A complete GPT-2 forward pass in plain NumPy, using GPT-2 small's real weights, checked against Hugging Face.
import numpy as np
import torch
from transformers import GPT2Model, GPT2TokenizerFast

tok = GPT2TokenizerFast.from_pretrained("openai-community/gpt2")
model = GPT2Model.from_pretrained("openai-community/gpt2").eval()
W = {k: v.numpy().astype(np.float64) for k, v in model.state_dict().items()}
H, dh = 12, 64

def layer_norm(x, g, b, eps=1e-5):
    m = x.mean(-1, keepdims=True)
    return (x - m) / np.sqrt(x.var(-1, keepdims=True) + eps) * g + b

def gelu(x):
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))

def block(x, l):
    p, n = f"h.{l}.", len(x)
    qkv = layer_norm(x, W[p + "ln_1.weight"], W[p + "ln_1.bias"]) @ W[p + "attn.c_attn.weight"] + W[p + "attn.c_attn.bias"]
    q, k, v = (t.reshape(n, H, dh).transpose(1, 0, 2) for t in np.split(qkv, 3, axis=-1))
    s = q @ k.transpose(0, 2, 1) / np.sqrt(dh) + np.triu(np.full((n, n), -np.inf), 1)   # causal mask
    a = np.exp(s - s.max(-1, keepdims=True))
    a /= a.sum(-1, keepdims=True)
    x = x + (a @ v).transpose(1, 0, 2).reshape(n, H * dh) @ W[p + "attn.c_proj.weight"] + W[p + "attn.c_proj.bias"]
    h = gelu(layer_norm(x, W[p + "ln_2.weight"], W[p + "ln_2.bias"]) @ W[p + "mlp.c_fc.weight"] + W[p + "mlp.c_fc.bias"])
    return x + h @ W[p + "mlp.c_proj.weight"] + W[p + "mlp.c_proj.bias"]

text = "The bank approved the loan because the customer had a steady income"
ids = tok(text, return_tensors="pt")
with torch.no_grad():
    ref = model(**ids, output_hidden_states=True).hidden_states

x = W["wte.weight"][ids["input_ids"][0].numpy()] + W["wpe.weight"][: ids["input_ids"].shape[1]]
x = block(x, 0)
print("block 1, largest difference:", f"{np.abs(x - ref[1][0].numpy()).max():.1e}")
for l in range(1, 12):
    x = block(x, l)
x = layer_norm(x, W["ln_f.weight"], W["ln_f.bias"])
print("all 12 blocks + final norm, largest difference:", f"{np.abs(x - ref[12][0].numpy()).max():.1e}")
print("output shape:", x.shape)
