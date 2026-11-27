greedy = DATA["gen"]["greedy"]["Your loan application has been"]["text"]

def check_real_text(ns):
    assert ns["cut_at_stop"](greedy, ["\n\n"]) == (" approved.", True), "GPT-2's greedy text stops at its first blank line: ' approved.'"
    out, hit = ns["cut_at_stop"](greedy, ["1-800"])
    assert hit and out.endswith("by calling "), "a stop sequence can be any string, even one the model splits into several tokens"

def check_earliest_wins(ns):
    assert ns["cut_at_stop"]("a. b\n\nc", ["\n\n", "."]) == ("a", True), "the earliest stop in the text wins, whatever order they're listed in"

def check_no_stop(ns):
    assert ns["cut_at_stop"]("hello", ["\n\n"]) == ("hello", False), "no stop sequence: the text is unchanged"
