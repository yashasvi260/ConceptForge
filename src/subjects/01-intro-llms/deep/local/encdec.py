# An encoder-decoder model (T5-small, about 60 million parameters) translating with a task prefix.
from transformers import AutoTokenizer, T5ForConditionalGeneration

tok = AutoTokenizer.from_pretrained("google-t5/t5-small")
model = T5ForConditionalGeneration.from_pretrained("google-t5/t5-small")
print(f"parameters: {sum(p.numel() for p in model.parameters()):,}")

for text in ["translate English to French: The cat sleeps.", "translate English to German: The house is wonderful."]:
    ids = tok(text, return_tensors="pt").input_ids              # the encoder reads this once
    out = model.generate(ids, max_new_tokens=20, do_sample=False)   # the decoder writes token by token
    print(f"{text}\n  -> {tok.decode(out[0], skip_special_tokens=True)}")
