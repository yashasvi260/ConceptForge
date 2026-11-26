# Worked example for "Special tokens and chat templates": real special-token IDs, and one control token
# encoded as a control token versus as ordinary text.
import json

sp = DATA["tokens"]["special"]
jobs = [
    ("BERT", "[CLS]", sp["bert"]["[CLS]"], "starts every input; its output vector is used to classify"),
    ("BERT", "[SEP]", sp["bert"]["[SEP]"], "ends a sentence or separates two"),
    ("BERT", "[PAD]", sp["bert"]["[PAD]"], "fills short inputs to the batch length"),
    ("BERT", "[MASK]", sp["bert"]["[MASK]"], "hides a word during pre-training"),
    ("GPT-4", "<|endoftext|>", sp["gpt4_endoftext"]["special_id"], "marks the end of a document"),
    ("Llama 3", "<|begin_of_text|>", sp["llama3"]["<|begin_of_text|>"], "starts the whole prompt"),
    ("Llama 3", "<|start_header_id|>", sp["llama3"]["<|start_header_id|>"], "opens a role name (system, user, assistant)"),
    ("Llama 3", "<|eot_id|>", sp["llama3"]["<|eot_id|>"], "ends one turn of the conversation"),
]
plain = sp["gpt4_endoftext"]["as_plain_text"]
print(json.dumps({
    "Special tokens in three real tokenizers": [list(j) for j in jobs],
    "The same 13 characters, as a control token or as text": [
        ["allowed as a special token", 1, str(sp["gpt4_endoftext"]["special_id"])],
        ["encoded as ordinary text", len(plain), " ".join(str(t["id"]) for t in plain)],
    ],
}))
