# Greedy generation with a KV cache in plain NumPy, using GPT-2 small's real weights, checked against Hugging Face.
import numpy as np
import torch
from transformers import GPT2LMHeadModel, GPT2TokenizerFast

tok = GPT2TokenizerFast.from_pretrained("openai-community/gpt2")
hf = GPT2LMHeadModel.from_pretrained("openai-community/gpt2").eval()
W = {k.removeprefix("transformer."): v.numpy().astype(np.float64) for k, v in hf.state_dict().items()}
H, dh = 12, 64

def layer_norm(x, g, b, eps=1e-5):
    m = x.mean(-1, keepdims=True)
    return (x - m) / np.sqrt(x.var(-1, keepdims=True) + eps) * g + b

def gelu(x):
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))

def block(x, l, cache):
    p, n = f"h.{l}.", len(x)
    qkv = layer_norm(x, W[p + "ln_1.weight"], W[p + "ln_1.bias"]) @ W[p + "attn.c_attn.weight"] + W[p + "attn.c_attn.bias"]
    q, k, v = (t.reshape(n, H, dh).transpose(1, 0, 2) for t in np.split(qkv, 3, axis=-1))
    if l in cache:                                             # the KV cache: past keys and values, per layer
        k, v = np.concatenate([cache[l][0], k], 1), np.concatenate([cache[l][1], v], 1)
    cache[l] = (k, v)
    T = k.shape[1]
    future = np.arange(T)[None, :] > (T - n + np.arange(n))[:, None]
    s = q @ k.transpose(0, 2, 1) / np.sqrt(dh) + np.where(future, -np.inf, 0)
    a = np.exp(s - s.max(-1, keepdims=True))
    a /= a.sum(-1, keepdims=True)
    x = x + (a @ v).transpose(1, 0, 2).reshape(n, H * dh) @ W[p + "attn.c_proj.weight"] + W[p + "attn.c_proj.bias"]
    h = gelu(layer_norm(x, W[p + "ln_2.weight"], W[p + "ln_2.bias"]) @ W[p + "mlp.c_fc.weight"] + W[p + "mlp.c_fc.bias"])
    return x + h @ W[p + "mlp.c_proj.weight"] + W[p + "mlp.c_proj.bias"]

def last_logits(ids, start, cache):
    x = W["wte.weight"][ids] + W["wpe.weight"][start:start + len(ids)]
    for l in range(12):
        x = block(x, l, cache)
    return layer_norm(x, W["ln_f.weight"], W["ln_f.bias"])[-1] @ W["wte.weight"].T   # tied LM head

def generate(prompt, n, use_cache):
    ids, cache, fed = list(prompt), {}, 0
    for step in range(n):
        if use_cache and step > 0:
            new, start = ids[-1:], len(ids) - 1                # feed only the newest token
        else:
            new, start, cache = ids, 0, {}                     # feed everything, start a fresh cache
        fed += len(new)
        ids.append(int(np.argmax(last_logits(new, start, cache))))
    return ids[len(prompt):], fed

prompt = tok("Your loan application has been")["input_ids"]
cached, fed_c = generate(prompt, 20, True)
plain, fed_p = generate(prompt, 20, False)
with torch.no_grad():
    ref = hf.generate(torch.tensor([prompt]), max_new_tokens=20, do_sample=False, pad_token_id=tok.eos_token_id)[0, len(prompt):].tolist()
print("NumPy with cache:", repr(tok.decode(cached)))
print("tokens fed with the cache:", fed_c, "| without:", fed_p)
print("same tokens with and without the cache:", cached == plain)
print("same tokens as Hugging Face generate():", cached == ref)
