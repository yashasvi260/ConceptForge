M = {m["name"]: m for m in DATA["models"]}

def flops_per_token(n_params, layers, d_model, context):
    """Kaplan et al.'s forward-pass estimate: 2 per non-embedding parameter, plus attention over the context:
    2 · n_params + 2 · layers · context · d_model."""
    return 2 * n_params + 2 * layers * context * d_model

def attention_share(n_params, layers, d_model, context):
    """The fraction of those FLOPs spent comparing with the context."""
    attn = 2 * layers * context * d_model
    return attn / flops_per_token(n_params, layers, d_model, context)

def crossover(n_params, layers, d_model):
    """The context length at which attention costs as much as everything else."""
    return n_params / (layers * d_model)

m = M["Llama 3 8B"]
print(round(attention_share(m["nonembedding_params"], m["layers"], m["d_model"], 8192), 3), crossover(m["nonembedding_params"], m["layers"], m["d_model"]))
