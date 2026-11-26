def memory_gb(params, bits):
    """Memory needed just to hold the weights, in gigabytes (1 GB = 10**9 bytes)."""
    # TODO: each parameter takes bits / 8 bytes.
    return 0

n = llama_params(llama)
for bits in (32, 16, 8, 4):
    print(f"{bits:>2}-bit: {memory_gb(n, bits):.2f} GB")
