def cut_at_stop(text, stops):
    """If any stop sequence occurs, cut the text just before the EARLIEST one and report it.
    Returns (text, stopped)."""
    # TODO
    return text, False

greedy = DATA["gen"]["greedy"]["Your loan application has been"]["text"]
print(cut_at_stop(greedy, ["\n\n"]))
