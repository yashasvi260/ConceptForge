def kv_projections(P, G, cache):
    """Token positions whose key and value are computed while generating G tokens after a P-token prompt.
    Without a cache, step t (t = 0 … G-1) reprocesses all P + t tokens; with one, every token is projected once."""
    # TODO
    return 0

def query_key_products(P, G, cache):
    """Query·key dot products per head per layer. Processing positions 1…n causally costs n(n+1)/2;
    with a cache, step t (t ≥ 1) only computes the newest token's row: P + t products (it also sees itself)."""
    # TODO
    return 0

print(kv_projections(512, 64, True), kv_projections(512, 64, False))
