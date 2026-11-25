# Tokenization: verified facts and sources

Every specific claim used in the Tokenization lesson, with where it was checked. Checked 2026-11-24.
"Verified by running" means the number comes from the real tokenizer code in this repo
(`src/subjects/tokenization/*.test.ts`), not from a web page.

## Byte-Pair Encoding (BPE)

| Claim | Source |
|---|---|
| BPE for NMT: start from characters plus an end-of-word symbol, repeatedly replace the most frequent adjacent pair ('A','B') with 'AB'; pairs never cross word boundaries. | Sennrich, Haddow & Birch 2016, §3.2 (read from the PDF) |
| Final symbol vocabulary = initial (character) vocabulary + number of merge operations; the number of merges is the only hyperparameter. | Sennrich et al. 2016, §3.2 |
| Algorithm 1 toy vocabulary: `{'l o w </w>': 5, 'l o w e r </w>': 2, 'n e w e s t </w>': 6, 'w i d e s t </w>': 3}`, `num_merges = 10`. | Sennrich et al. 2016, Algorithm 1 |
| Encoding new text applies the learned merges in the order they were learned. | HF LLM course ch. 6.5 ("Applying the merge rules learned in order") |
| GPT-2: byte-level BPE, vocabulary 50,257 = 256 byte tokens + 50,000 merges + 1 end-of-text token. | HF Transformers "Tokenizer summary" |
| Byte-level BPE can tokenize any text without an unknown token (every string is bytes). | HF Tokenizer summary |
| GPT-2-style tokenizers show a leading space as `Ġ` inside tokens (e.g. `Ġthe`). Appears in HF course ch. 6.5 output; the course does not explain the character in prose. The lesson explains it as the byte-to-printable-character mapping for a space. | HF LLM course ch. 6.5 (examples), GPT-2 `bytes_to_unicode` |
| Models using BPE today include Llama, Gemma, Qwen2. | HF Tokenizer summary |

## OpenAI tiktoken encodings

| Claim | Source |
|---|---|
| `o200k_base` → GPT-4o, GPT-4o mini; `cl100k_base` → GPT-4, GPT-4 Turbo, GPT-3.5 Turbo. | OpenAI cookbook "How to count tokens with tiktoken" |
| `cl100k_base` special tokens: `<|endoftext|>` 100257, `<|fim_prefix|>` 100258, `<|fim_middle|>` 100259, `<|fim_suffix|>` 100260, `<|endofprompt|>` 100276. | tiktoken `tiktoken_ext/openai_public.py` (raw file) |
| `o200k_base` special tokens: `<|endoftext|>` 199999, `<|endofprompt|>` 200018. | tiktoken `openai_public.py` |
| `o200k_base` ≈ 200k tokens, `cl100k_base` ≈ 100k. Sources disagree on the exact count depending on whether special tokens / id gaps are counted; the lesson labels them "≈200k" / "≈100k" rather than quoting an exact figure. | tiktoken source; verified by running |
| GPT-2 / r50k: `<|endoftext|>` = 50256. | tiktoken `openai_public.py` |

## WordPiece (BERT)

| Claim | Source |
|---|---|
| Training merges by score = freq(pair) / (freq(first) × freq(second)), favouring pairs whose parts are rare. | HF LLM course ch. 6.6; HF Tokenizer summary |
| Tokenizing keeps only the vocabulary (no merge list): longest-match-first from the start of the word, continuation pieces prefixed `##`. Example: `hugs` → `hug`, `##s`. | HF LLM course ch. 6.6 |
| If any part of a word can't be matched, the **whole word** becomes `[UNK]` (BPE would only mark the unknown characters). | HF LLM course ch. 6.6 |
| `bert-base-uncased`: vocab_size 30,522; `[PAD]`=0, `[UNK]`=100, `[CLS]`=101, `[SEP]`=102, `[MASK]`=103; 5,828 entries start with `##`; lower-cases input. | HF `bert-base-uncased` config.json, vocab.txt, tokenizer_config.json (raw files) |
| **Correction:** the often-quoted `unaffable → un ##aff ##able` is *not* produced by `bert-base-uncased`: `##aff` is not in its vocabulary. The lesson uses the real vocab file and shows what it actually produces. | `bert-base-uncased` vocab.txt |
| WordPiece is used by BERT-family models (DistilBERT, ELECTRA). | HF Tokenizer summary |

## Unigram and SentencePiece

| Claim | Source |
|---|---|
| Unigram LM tokenization introduced with subword regularisation (sampling several segmentations during training), helping most in low-resource / out-of-domain settings. | Kudo 2018 (ACL), abstract |
| Unigram training starts from a large vocabulary and repeatedly removes the p% (usually 10–20%) of symbols whose removal increases the loss least; base characters are never removed. | HF LLM course ch. 6.7; HF Tokenizer summary |
| Unigram tokenization picks the most probable segmentation with the Viterbi algorithm. | HF LLM course ch. 6.7 |
| SentencePiece treats whitespace as a symbol, escaping it as `▁` (U+2581); detokenization is lossless: `"".join(pieces).replace("▁", " ")`. | google/sentencepiece README |
| SentencePiece works on raw text and suits languages without spaces (Chinese, Japanese, Thai); implements both BPE and Unigram. | google/sentencepiece README |
| Unigram is used by T5, BigBird, Pegasus. | HF Tokenizer summary |

## Other models

| Claim | Source |
|---|---|
| Llama 3: vocab_size 128,256; 128K-token vocabulary built on tiktoken (100K from tiktoken + 28K extra for non-English). | Llama 3.1 config.json (raw); DeepLearning.AI Llama course |
| Llama 3 chat template: `<|begin_of_text|>` then per message `<|start_header_id|>{role}<|end_header_id|>\n\n{content}<|eot_id|>`; eos = `<|eot_id|>`. | Llama 3.1 tokenizer_config.json `chat_template` (raw) |

## Glitch tokens

| Claim | Source |
|---|---|
| "SolidGoldMagikarp" (Rumbelow & Watkins, SERI-MATS, Feb 2023): tokens such as Reddit usernames were frequent in the tokenizer's training data, got their own tokens, but were rare in the model's training data, so models behaved strangely on them. The anomalous behaviour was reported in GPT-3-era models, which share GPT-2's (r50k) vocabulary. | LessWrong "SolidGoldMagikarp (plus, prompt generation)" and the glitch-tokens wiki |

## Verified by running the real tokenizers (js-tiktoken 1.0.21)

Counts are computed live in the lesson; the key ones are pinned in `realTokenizers.test.ts`.

| Text | GPT-4o `o200k_base` | GPT-4 `cl100k_base` |
|---|---|---|
| English: "The weather is beautiful today, let's go for a walk." | 12 | 13 (`" let"` + `"'s"`) |
| Spanish: "Hoy hace un tiempo precioso, vamos a dar un paseo." | 12 | 16 (`"H" "oy"`, `" p" "ase" "o"`) |
| Hindi: "आज मौसम बहुत सुंदर है, चलो टहलने चलते हैं।" | 14 | **45** (many tokens are partial UTF-8 bytes) |
| Japanese: "今日はとても良い天気なので、散歩に行きましょう。" | 17 | 28 |
| Code: `for (let i = 0; i < 10; i++) { console.log(i); }` | 21 | 21 |
| `strawberry` | 3: `st` `raw` `berry` | 3: `str` `aw` `berry` |
| "How many r's are in strawberry?" | ` strawberry` is **one** token | ` strawberry` is one token |
| ` strawberry` (leading space) | 1 | 1 |
| `STRAWBERRY` | 4: `ST` `RAW` `B` `ERRY` | 4 |
| `1234567` | 3: `123` `456` `7` | 3 |
| `3.14159` | 4: `3` `.` `141` `59` | 4 |
| ` SolidGoldMagikarp` | 5 | 5 |
| ` SolidGoldMagikarp` in **GPT-2** (`gpt2` ranks) | n/a | single token, id 43453 |

Takeaways the lesson relies on: newer vocabularies are fairer to non-English text (Hindi 45 → 14);
the model sees `strawberry` as 3 chunks, not 10 letters; a leading space changes the tokens;
numbers are cut into 3-digit chunks; the GPT-2 glitch token no longer exists as one token in GPT-4/4o.

## Further reading (shown in the cheat-sheet step)

- Sennrich, Haddow & Birch (2016), *Neural Machine Translation of Rare Words with Subword Units*: https://aclanthology.org/P16-1162/
- Kudo (2018), *Subword Regularization*: https://aclanthology.org/P18-1007/
- google/sentencepiece: https://github.com/google/sentencepiece
- Hugging Face, *Summary of the tokenizers*: https://huggingface.co/docs/transformers/tokenizer_summary
- Hugging Face LLM course, ch. 6 (BPE, WordPiece, Unigram): https://huggingface.co/learn/llm-course/chapter6/5
- OpenAI, *How to count tokens with tiktoken*: https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken
- openai/tiktoken: https://github.com/openai/tiktoken
- *SolidGoldMagikarp (plus, prompt generation)*: https://www.lesswrong.com/posts/aPeJE8bSo6rAFoLqg

## Hedged in the lesson (rules of thumb, not precise facts)

- "1 token ≈ 4 characters ≈ ¾ word" for English: OpenAI's commonly quoted rough rule of thumb; the lesson labels it as rough and shows real counts instead.
- Subword regularisation benefits: stated as Kudo (2018) reports them (most helpful in low-resource and out-of-domain settings), not as general robustness.
