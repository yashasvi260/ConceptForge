MODELS = {m["name"]: m for m in DATA["models"]}
SIZES = DATA["sizes"]

def table_params(vocab, d_model):
    """Parameters in an embedding table: one row of d_model numbers per vocabulary entry."""
    # TODO
    return 0

def vocab_share(model):
    """Percent of the model's parameters spent on vocabulary tables (input table, plus the output head if not tied)."""
    # TODO: copies = 1 if model["tied_embeddings"] else 2
    return 0.0

def extra_params(old_vocab, new_vocab, d_model, tied):
    """Extra parameters from growing the vocabulary, for a model of width d_model."""
    # TODO
    return 0

for name, m in MODELS.items():
    print(f"{name:<12} {vocab_share(m):5.1f}% of parameters are vocabulary tables")
print("GPT-4 → GPT-4o vocabulary at d=4096, untied:", f'{extra_params(SIZES["cl100k_base"], SIZES["o200k_base"], 4096, False):,}')
