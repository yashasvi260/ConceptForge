M = {m["name"]: m for m in DATA["models"]}

def matching_swiglu_width(d):
    """Hidden width f that gives a SwiGLU network (3·d·f parameters) the same size as a 4×-wide GELU one (2·d·4d)."""
    return 8 * d / 3

def swiglu_vs_gelu(m):
    """How many times larger the model's SwiGLU network is than a 4×-wide GELU network of the same d."""
    d = m["d_model"]
    return 3 * d * m["ffn"] / (2 * d * 4 * d)

ll = M["Llama 3 8B"]
print(round(matching_swiglu_width(ll["d_model"]), 1), ll["ffn"], round(swiglu_vs_gelu(ll), 4))
