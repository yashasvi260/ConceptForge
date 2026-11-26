def check_window_is_shared_by_prompt_and_answer(ns):
    got = (ns["max_output"](120_000, 128_000), ns["max_output"](130_000, 128_000))
    assert got == (8_000, 0), f"128k window: 8,000 left after a 120k prompt, 0 (never negative) after 130k; got {got}"

def check_keeps_system_and_newest_turns(ns):
    got = ns["trim_history"]([300, 1200, 800, 2500, 600, 900], 3000)
    assert got == [300, 600, 900], f"system 300 + newest 900 + 600 = 1,800; the 2,500 turn would overflow: [300, 600, 900], got {got}"

def check_stops_at_the_first_turn_that_does_not_fit(ns):
    got = ns["trim_history"]([100, 50, 5000, 200], 1000)
    assert got == [100, 200], f"skipping the 5,000 turn to keep the older 50 would leave a gap in the conversation: [100, 200], got {got}"
