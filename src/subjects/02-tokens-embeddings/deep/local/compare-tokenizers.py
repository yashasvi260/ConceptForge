# The same text through three real tokenizers: GPT-2 (byte-level BPE), BERT (WordPiece) and T5 (Unigram).
from transformers import AutoTokenizer

texts = ["unaffable", "Tokenization of HuggingFace", "The river bank flooded."]
for name in ["openai-community/gpt2", "google-bert/bert-base-uncased", "google-t5/t5-small"]:
    tok = AutoTokenizer.from_pretrained(name)
    print(f"== {name} (vocabulary {tok.vocab_size:,})")
    for t in texts:
        print(f"  {t!r:<32} {tok.tokenize(t)}")
