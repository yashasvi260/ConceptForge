import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { Panel, Slider, Stat } from "../../../components/ui";
import { accuracy, argmax, confusionMatrix, predictProba, type SoftmaxModel } from "../classifier";
import { LABEL_IDS, TEST_TICKETS, TRAIN_TICKETS, ticketVector, trainHead } from "../model";

export function LossCurve({ losses }: { losses: number[] }) {
  const W = 360;
  const H = 120;
  const max = Math.max(...losses, 1e-9);
  const pts = losses.map((l, i) => `${(i / Math.max(1, losses.length - 1)) * W},${H - (l / max) * (H - 8) - 4}`).join(" ");
  return (
    <svg role="img" aria-label="Training loss" viewBox={`0 0 ${W} ${H}`} className="h-32 w-full">
      <line x1={0} x2={W} y1={H - 4} y2={H - 4} style={{ stroke: "var(--color-slate-700)" }} />
      <polyline points={pts} fill="none" strokeWidth={2} style={{ stroke: "var(--color-emerald-400)" }} />
      <text x={4} y={12} fontSize={10} style={{ fill: "var(--color-slate-400)" }}>
        loss {losses[0]?.toFixed(2)} → {losses.at(-1)?.toFixed(3)}
      </text>
    </svg>
  );
}

export function ConfusionTable({ matrix }: { matrix: number[][] }) {
  return (
    <table aria-label="Confusion matrix" className="text-xs">
      <thead>
        <tr>
          <th className="p-1 text-left font-normal text-slate-500">true ↓ / predicted →</th>
          {LABEL_IDS.map((l) => (
            <th key={l} className="p-1 font-mono font-normal text-slate-400">
              {l}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, i) => (
          <tr key={i}>
            <th className="p-1 text-left font-mono font-normal text-slate-400">{LABEL_IDS[i]}</th>
            {row.map((n, j) => (
              <td
                key={j}
                className={`p-1 text-center font-mono ${n === 0 ? "text-slate-600" : i === j ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"}`}
              >
                {n}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function evaluateHead(model: SoftmaxModel) {
  const truth = TEST_TICKETS.map((t) => LABEL_IDS.indexOf(t.label));
  const pred = TEST_TICKETS.map((t) => argmax(predictProba(model, ticketVector(t.id))));
  return { truth, pred, acc: accuracy(truth, pred), matrix: confusionMatrix(truth, pred, LABEL_IDS.length) };
}

export function TrainView() {
  const [epochs, setEpochs] = useState(200);
  const [lr, setLr] = useState(2);
  const [model, setModel] = useState<SoftmaxModel | null>(null);
  const [ms, setMs] = useState(0);
  const result = model ? evaluateHead(model) : null;

  const train = () => {
    const t0 = performance.now();
    const m = trainHead({ epochs, lr });
    setMs(performance.now() - t0);
    setModel(m);
  };

  return (
    <Panel title="Train the head (live, on real MiniLM vectors)" icon={<GraduationCap size={14} />}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="Epochs (passes over the training set)" value={epochs} min={5} max={400} step={5} onChange={setEpochs} />
        <Slider label="Learning rate" value={lr} min={0.1} max={5} step={0.1} onChange={setLr} format={(v) => v.toFixed(1)} />
      </div>
      <button type="button" onClick={train} className="mt-3 rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
        Train the head
      </button>
      {model && result && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <LossCurve losses={model.lossHistory} />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Stat label="Test accuracy" value={`${Math.round(result.acc * 100)}%`} sub={undefined} />
              <Stat label="Trained in" value={`${ms.toFixed(0)} ms`} sub={`${TRAIN_TICKETS.length} tickets × ${epochs} epochs`} />
            </div>
            <p data-testid="head-accuracy" className="mt-2 text-sm text-slate-300">
              {result.truth.filter((t, i) => t === result.pred[i]).length} / {TEST_TICKETS.length} held-out tickets correct
            </p>
          </div>
          <ConfusionTable matrix={result.matrix} />
        </div>
      )}
    </Panel>
  );
}
