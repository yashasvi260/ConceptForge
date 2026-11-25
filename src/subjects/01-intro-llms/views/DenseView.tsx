import { Panel } from "../../../components/ui";
import { LongInputNote, ModelRunError, ModelStatus } from "../../../ml/ModelStatus";
import { useEmbeddings } from "../../../ml/useEmbeddings";
import { useModelRun } from "../../../ml/useModelRun";
import { cosine } from "../../../ml/vector";
import { bagOfWords, bowCosine } from "../bow";
import { SentencesInput, parseSentences } from "./BowView";

export function DenseView({ text, setText }: { text: string; setText: (t: string) => void }) {
  const model = useEmbeddings();
  const e = model.embedder;
  const sentences = parseSentences(text);
  const run = useModelRun(e && sentences.length ? () => e.embedSentences(sentences) : null, sentences.join("\n"));
  const { counts } = bagOfWords(sentences);
  const vecs = run.value;

  return (
    <>
      <SentencesInput text={text} setText={setText} />
      <Panel title="Bag-of-Words vs real MiniLM embeddings">
        <ModelStatus state={model}>
          {run.error && <ModelRunError />}
          <LongInputNote show={!!e && sentences.some((x) => e.isTruncated(x))} />
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-1 font-normal">Pair</th>
                <th className="py-1 text-right font-normal">Bag-of-Words</th>
                <th className="py-1 text-right font-normal">Embeddings</th>
              </tr>
            </thead>
            <tbody>
              {sentences.flatMap((a, i) =>
                sentences.slice(i + 1).map((b, k) => {
                  const j = i + k + 1;
                  const emb = vecs ? cosine(vecs[i]!, vecs[j]!) : null;
                  return (
                    <tr key={`${i}-${j}`} className="border-t border-slate-800">
                      <td className="py-1.5 pr-3 text-slate-300">
                        {a} ↔ {b}
                      </td>
                      <td className="py-1.5 text-right font-mono text-slate-400" data-testid="bow-sim">
                        {bowCosine(counts[i]!, counts[j]!).toFixed(2)}
                      </td>
                      <td className="py-1.5 text-right font-mono text-sky-200" data-testid="emb-sim">
                        {emb === null ? "…" : emb.toFixed(2)}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">
            Embedding scores are computed live by all-MiniLM-L6-v2 in your browser (384 numbers per sentence).
          </p>
        </ModelStatus>
      </Panel>
    </>
  );
}
