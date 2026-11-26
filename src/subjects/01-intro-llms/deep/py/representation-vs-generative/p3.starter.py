def forward_flops(n_params, n_tokens):
    """About 2 operations per parameter for every token the model processes."""
    return 0  # TODO

embed = forward_flops(22_713_216, 10)         # MiniLM reads a 10-token ticket
ask = forward_flops(8_030_261_248, 60 + 2)    # an 8B decoder reads a 60-token prompt and writes 2 tokens
print(f"embed: {embed:.1e}   ask: {ask:.1e}   ratio: {ask / embed if embed else 0:,.0f}x")
