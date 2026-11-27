M = {m["name"]: m for m in DATA["models"]}

def flops_per_token(n_params, layers, d_model, context):
    """Kaplan et al.'s forward-pass estimate: 2 per non-embedding parameter, plus attention over the context:
    2 · n_params + 2 · layers · context · d_model."""
    # TODO
    return 0

def attention_share(n_params, layers, d_model, context):
    """The fraction of those FLOPs spent comparing with the context."""
    # TODO
    return 0.0

def crossover(n_params, layers, d_model):
    """The context length at which attention costs as much as everything else."""
    # TODO
    return 0

m = M["Llama 3 8B"]
print(round(attention_share(m["nonembedding_params"], m["layers"], m["d_model"], 8192), 3), crossover(m["nonembedding_params"], m["layers"], m["d_model"]))
