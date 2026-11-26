def train_flops(n_params, n_tokens):
    """Approximate training compute: about 6 floating-point operations per parameter per training token."""
    return 0  # TODO

def flops_per_generated_token(n_params):
    """Approximate inference compute: about 2 operations per parameter for each new token."""
    return 0  # TODO

N, D = 8_030_261_248, 15e12
print(f"training:  {train_flops(N, D):.2e} FLOPs")
print(f"per token: {flops_per_generated_token(N):.2e} FLOPs")
