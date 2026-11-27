MIX = DATA["mixtral"]   # Mixtral 8x7B's published configuration

def moe_params(m):
    """(total, active per token) for a Mixtral-style model. Per block: attention (Q and O are d × d; K and V are
    d × kv_heads·head_dim), `experts` SwiGLU networks of 3·d·ffn each, a router (d × experts) and two RMSNorms (d each).
    Plus a final norm (d), the token table and a separate output head (vocab × d each). Active: only
    `experts_per_token` experts per block."""
    d, f, E = m["d_model"], m["ffn"], m["experts"]
    kv = m["kv_heads"] * (d // m["heads"])
    shared = 2 * d * d + 2 * d * kv + d * E + 2 * d       # attention, router and norms: used by every token
    expert = 3 * d * f
    outside = d + 2 * m["vocab"] * d
    total = m["layers"] * (shared + E * expert) + outside
    active = m["layers"] * (shared + m["experts_per_token"] * expert) + outside
    return total, active

total, active = moe_params(MIX)
print(f"{total:,} total, {active:,} active ({100 * active / max(total, 1):.1f}%)")
