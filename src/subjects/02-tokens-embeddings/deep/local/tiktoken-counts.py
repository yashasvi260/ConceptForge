# Count and inspect tokens with OpenAI's real tokenizers (GPT-4: cl100k_base, GPT-4o: o200k_base).
import tiktoken

texts = {
    "English": "The weather is beautiful today, let's go for a walk.",
    "Hindi": "आज मौसम बहुत सुंदर है, चलो टहलने चलते हैं।",
    "Numbers": "1234567 + 3.14159 = 1234570.14159",
}
for enc_name in ["cl100k_base", "o200k_base"]:
    enc = tiktoken.get_encoding(enc_name)
    print(f"== {enc_name} (n_vocab {enc.n_vocab:,})")
    for label, text in texts.items():
        print(f"  {label:<8} {len(enc.encode(text)):>3} tokens")
    print("  pieces of 1234567:", [enc.decode([t]) for t in enc.encode("1234567")])

enc = tiktoken.get_encoding("cl100k_base")
try:
    enc.encode("user text <|endoftext|>")
except ValueError as e:
    print("refused by default:", str(e).splitlines()[0][:70])
print("as plain text:", enc.encode("<|endoftext|>", disallowed_special=()))
