MIX = DATA["mixtral"]   # Mixtral 8x7B's published configuration

def moe_params(m):
    """(total, active per token) for a Mixtral-style model. Per block: attention (Q and O are d × d; K and V are
    d × kv_heads·head_dim), `experts` SwiGLU networks of 3·d·ffn each, a router (d × experts) and two RMSNorms (d each).
    Plus a final norm (d), the token table and a separate output head (vocab × d each). Active: only
    `experts_per_token` experts per block."""
    # TODO
    return 0, 0

total, active = moe_params(MIX)
print(f"{total:,} total, {active:,} active ({100 * active / max(total, 1):.1f}%)")
