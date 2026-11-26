def memory_gb(params, bits):
    """Memory needed just to hold the weights, in gigabytes (1 GB = 10**9 bytes)."""
    return params * bits / 8 / 1e9

n = llama_params(llama)
for bits in (32, 16, 8, 4):
    print(f"{bits:>2}-bit: {memory_gb(n, bits):.2f} GB")
