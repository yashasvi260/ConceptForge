# Train a real BPE tokenizer with Hugging Face `tokenizers` on the low/lower/newest/widest corpus,
# then encode words it has never seen.
from tokenizers import Tokenizer, models, pre_tokenizers, trainers

corpus = ["low"] * 5 + ["lower"] * 2 + ["newest"] * 6 + ["widest"] * 3
tok = Tokenizer(models.BPE(end_of_word_suffix="</w>"))
tok.pre_tokenizer = pre_tokenizers.Whitespace()
trainer = trainers.BpeTrainer(vocab_size=21, end_of_word_suffix="</w>", show_progress=False)
tok.train_from_iterator(corpus, trainer)

print("vocabulary size:", tok.get_vocab_size())
merges = tok.to_str()  # the trained model, as JSON
import json
print("first merges:", json.loads(merges)["model"]["merges"][:10])
for word in ["lowest", "newer", "slowly", "newest"]:
    print(f"{word:<8} → {tok.encode(word).tokens}")
