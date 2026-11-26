def llama3_prompt(messages):
    """Llama 3's chat format as text. Start with <|begin_of_text|>; each message is
    <|start_header_id|>ROLE<|end_header_id|> + two newlines + the content (stripped) + <|eot_id|>.
    End with an empty assistant header, so the model writes the assistant's reply next."""
    header = lambda role: f"<|start_header_id|>{role}<|end_header_id|>\n\n"
    out = "<|begin_of_text|>"
    for m in messages:
        out += header(m["role"]) + m["content"].strip() + "<|eot_id|>"
    return out + header("assistant")

chat = [{"role": "system", "content": "You are a helpful bank assistant."},
        {"role": "user", "content": "How do I reset my PIN?"}]
print(llama3_prompt(chat))
