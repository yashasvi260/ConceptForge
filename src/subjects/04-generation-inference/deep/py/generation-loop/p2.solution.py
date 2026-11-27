def cut_at_stop(text, stops):
    """If any stop sequence occurs, cut the text just before the EARLIEST one and report it.
    Returns (text, stopped)."""
    hits = [text.find(s) for s in stops if s and s in text]
    if not hits:
        return text, False
    return text[: min(hits)], True

greedy = DATA["gen"]["greedy"]["Your loan application has been"]["text"]
print(cut_at_stop(greedy, ["\n\n"]))
