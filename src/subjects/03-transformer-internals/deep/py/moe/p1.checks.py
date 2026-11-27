MIX = DATA["mixtral"]

def check_mixtral_counts(ns):
    total, active = ns["moe_params"](MIX)
    assert total == 46702792704, f"Mixtral 8x7B: 46,702,792,704 parameters (published: 47B), got {total:,}"
    assert active == 12879925248, f"12,879,925,248 used per token (published: 13B active), got {active:,}"

def check_all_experts_active_means_dense(ns):
    dense = dict(MIX, experts_per_token=MIX["experts"])
    t, a = ns["moe_params"](dense)
    assert t == a, "if every token used every expert, active would equal total"
