import { BookMarked, ExternalLink, HelpCircle } from "lucide-react";
import { Panel, RichText } from "../../../components/ui";

const TERMS: [string, string][] = [
  ["Token", "A piece of text (word, part of a word, character or byte) that the model handles as one unit."],
  ["Token ID", "The token's number: its position in the vocabulary. The model only ever sees IDs."],
  ["Vocabulary", "The fixed list of all tokens a tokenizer knows (BERT 30,522; GPT-4o ≈200k)."],
  ["Subword", "A piece smaller than a word: common words stay whole, rare ones are split."],
  ["BPE", "Byte-Pair Encoding: learn the vocabulary by repeatedly merging the most frequent adjacent pair."],
  ["Byte-level BPE", "BPE that starts from the 256 bytes, so any text can be encoded with no unknown token."],
  ["WordPiece", "BERT's tokenizer: greedy longest match, `##` marks continuations, failures become `[UNK]`."],
  ["Unigram", "Start big, prune pieces that matter least; tokenize with the most probable split (Viterbi)."],
  ["SentencePiece", "Library that works on raw text, turning spaces into `▁` so tokenization is lossless."],
  ["Special token", "A reserved control token (`<|endoftext|>`, `[CLS]`, `<|eot_id|>`) that isn't ordinary text."],
  ["Chat template", "The recipe that turns a list of chat messages into one token stream with special tokens."],
  ["Context window", "The most tokens a model can handle at once, prompt plus answer."],
  ["Embedding table", "A learned table with one vector per token ID; lookup = take row `token_id` (MiniLM: 30,522 × 384)."],
  ["Contextual embedding", "A token's vector after the transformer layers, which depends on the surrounding words."],
  ["Mean pooling", "Averaging token vectors into one sentence vector (MiniLM then normalises it to length 1)."],
  ["Cosine similarity", "How closely two vectors point the same way: ≈1 similar, ≈0 unrelated."],
];

const ALGORITHMS: { name: string; builds: string; tokenizes: string; unknown: string; usedBy: string }[] = [
  { name: "BPE", builds: "Merge the most frequent pair, repeat", tokenizes: "Replay merges in learned order", unknown: "Byte-level: never unknown", usedBy: "GPT family, Llama, Gemma, Qwen2" },
  { name: "WordPiece", builds: "Merge the pair with the best freq(ab) / (freq(a)·freq(b))", tokenizes: "Greedy longest match, `##` continuations", unknown: "Whole word → `[UNK]`", usedBy: "BERT, DistilBERT, ELECTRA" },
  { name: "Unigram", builds: "Start big, prune 10–20% least useful per round", tokenizes: "Most probable split (Viterbi)", unknown: "Keeps all base characters", usedBy: "T5, BigBird, Pegasus" },
];

const NUMBERS: [string, string][] = [
  ["English (rough rule of thumb)", "1 token ≈ 4 characters ≈ ¾ word"],
  ["UTF-8", "1 byte (ASCII) to 4 bytes (emoji) per character"],
  ["GPT-2 vocabulary", "50,257 = 256 bytes + 50,000 merges + 1"],
  ["BPE vocabulary size", "initial characters + number of merges"],
  ["Hindi sentence (this lesson)", "45 tokens in GPT-4 → 14 in GPT-4o"],
  ["`strawberry` in GPT-4o", "3 tokens: st · raw · berry; ` strawberry` = 1"],
];

const QUESTIONS: [string, string][] = [
  ["Why subwords instead of words or characters?", "Words need an endless vocabulary and break on new words; characters make sequences very long. Subwords keep a fixed vocabulary that can still spell anything."],
  ["How does BPE training work?", "Start from characters (or bytes), count adjacent pairs, merge the most frequent into a new token, repeat N times. Final vocabulary = base symbols + N."],
  ["Why do GPT models never output [UNK]?", "Byte-level BPE starts from all 256 byte values, and every string is made of bytes."],
  ["BPE vs WordPiece vs Unigram?", "BPE merges by frequency and replays merges; WordPiece scores merges by likelihood and matches longest-first; Unigram prunes a big vocabulary and picks the most probable split."],
  ["Why can't LLMs count the r's in strawberry?", "They see one or a few multi-letter tokens (in a question, ` strawberry` is a single token), not letters, so they must recall spelling instead of reading it."],
  ["Why is non-English text more expensive?", "Tokenizers are trained on English-heavy data, so other scripts get fewer merges and split into more tokens: higher cost, less context."],
  ["Why must user text never become special tokens?", "Otherwise a user could end their turn and inject fake system or assistant messages (prompt injection)."],
  ["How should you size RAG chunks?", "In tokens, with the embedding/LLM model's own tokenizer, with some overlap so boundary sentences survive."],
];

const READING: [string, string][] = [
  ["Sennrich, Haddow & Birch (2016): Neural Machine Translation of Rare Words with Subword Units", "https://aclanthology.org/P16-1162/"],
  ["Kudo (2018): Subword Regularization (Unigram LM)", "https://aclanthology.org/P18-1007/"],
  ["google/sentencepiece", "https://github.com/google/sentencepiece"],
  ["Hugging Face: Summary of the tokenizers", "https://huggingface.co/docs/transformers/tokenizer_summary"],
  ["Hugging Face LLM course, chapter 6 (BPE, WordPiece, Unigram)", "https://huggingface.co/learn/llm-course/chapter6/5"],
  ["OpenAI cookbook: How to count tokens with tiktoken", "https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken"],
  ["openai/tiktoken", "https://github.com/openai/tiktoken"],
  ["SolidGoldMagikarp (plus, prompt generation)", "https://www.lesswrong.com/posts/aPeJE8bSo6rAFoLqg"],
  ["all-MiniLM-L6-v2 model card (the embedding model used here)", "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2"],
];

export function CheatSheetView() {
  return (
    <>
      <Panel title="Key terms" icon={<BookMarked size={14} />}>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
          {TERMS.map(([t, d]) => (
            <div key={t} className="contents">
              <dt className="font-semibold text-slate-100">{t}</dt>
              <dd className="text-sm text-slate-400">
                <RichText text={d} />
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title="Algorithms compared">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-2 pr-3 font-normal" />
                <th className="py-2 pr-3 font-normal">Builds its vocabulary by</th>
                <th className="py-2 pr-3 font-normal">Tokenizes by</th>
                <th className="py-2 pr-3 font-normal">Unknown text</th>
                <th className="py-2 font-normal">Used by</th>
              </tr>
            </thead>
            <tbody>
              {ALGORITHMS.map((a) => (
                <tr key={a.name} className="border-t border-slate-800 align-top text-slate-300">
                  <td className="py-2 pr-3 font-semibold text-slate-100">{a.name}</td>
                  {[a.builds, a.tokenizes, a.unknown, a.usedBy].map((c, i) => (
                    <td key={i} className="py-2 pr-3">
                      <RichText text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Numbers to remember">
          <ul className="space-y-1.5 text-sm">
            {NUMBERS.map(([k, v]) => (
              <li key={k} className="flex justify-between gap-4 border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">
                  <RichText text={k} />
                </span>
                <span className="text-right font-mono text-slate-100">{v}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Common interview questions" icon={<HelpCircle size={14} />}>
          <div className="space-y-1.5">
            {QUESTIONS.map(([q, a]) => (
              <details key={q} className="rounded-lg bg-slate-950/60 px-3 py-2 text-sm">
                <summary className="cursor-pointer text-slate-200">{q}</summary>
                <p className="mt-1.5 text-slate-400">{a}</p>
              </details>
            ))}
          </div>
        </Panel>
      </div>

      <section aria-label="Further reading" className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Further reading</h3>
        <ul className="space-y-1.5 text-sm">
          {READING.map(([title, href]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sky-300 hover:underline">
                {title} <ExternalLink size={12} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
