CHAT = [{"role": "system", "content": "You are a helpful bank assistant."},
        {"role": "user", "content": "  How do I reset my PIN?  "}]
WANT = ("<|begin_of_text|>"
        "<|start_header_id|>system<|end_header_id|>\n\nYou are a helpful bank assistant.<|eot_id|>"
        "<|start_header_id|>user<|end_header_id|>\n\nHow do I reset my PIN?<|eot_id|>"
        "<|start_header_id|>assistant<|end_header_id|>\n\n")

def check_exact_llama3_format(ns):
    got = ns["llama3_prompt"](CHAT)
    assert got == WANT, f"expected exactly:\n{WANT!r}\ngot:\n{got!r}"

def check_ends_by_opening_the_assistant_turn(ns):
    got = ns["llama3_prompt"]([{"role": "user", "content": "hi"}])
    assert got.endswith("<|start_header_id|>assistant<|end_header_id|>\n\n"), "the prompt must end with an open assistant header, or the model won't know it should reply"
