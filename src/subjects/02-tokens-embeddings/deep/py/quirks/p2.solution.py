def max_output(prompt_tokens, context_window):
    """The most tokens the model can still generate: the window holds prompt AND answer together."""
    return max(0, context_window - prompt_tokens)

def trim_history(turns, budget):
    """Keep the system message (turns[0]) and as many of the MOST RECENT other turns as fit in budget tokens.
    turns: list of token counts, oldest first. Returns the kept counts, in their original order."""
    kept, used = [], turns[0]
    for t in reversed(turns[1:]):
        if used + t > budget:
            break
        kept.insert(0, t)
        used += t
    return [turns[0]] + kept

print(max_output(120_000, 128_000), max_output(130_000, 128_000))
print(trim_history([300, 1200, 800, 2500, 600, 900], 3000))
