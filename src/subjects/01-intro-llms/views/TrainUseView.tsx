import { Cpu, GraduationCap } from "lucide-react";
import { Panel, Stat } from "../../../components/ui";
import { MODEL_CONFIGS, paramBreakdown, short } from "../modelConfigs";

const llama = MODEL_CONFIGS.find((c) => c.id === "llama3-8b")!;
const N = paramBreakdown(llama).total;
const D = llama.trainingTokens!;
const trainFlops = 6 * N * D; // Kaplan et al. 2020 rule of thumb: ≈ 6 · parameters · training tokens
const tokenFlops = 2 * N; // ≈ 2 · parameters per generated token (forward pass only)

const sci = (x: number) => {
  const e = Math.floor(Math.log10(x));
  return `${(x / 10 ** e).toFixed(1)} × 10^${e}`;
};

export function TrainUseView() {
  return (
    <Panel title="Training vs using: Llama 3 8B" icon={<GraduationCap size={14} />}>
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="Training" className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h4 className="flex items-center gap-2 font-semibold text-white">
            <GraduationCap size={15} /> Training (once)
          </h4>
          <p className="text-sm text-slate-300">Read 15 trillion+ tokens and nudge all 8 billion weights after every batch so the next-token guesses get better.</p>
          <Stat label="Compute (≈ 6 · params · tokens)" value={`${sci(trainFlops)} FLOPs`} />
          <Stat label="Reported GPU time" value="1.3 M H100 hours" sub="Meta model card, 8B pre-training" />
        </section>
        <section aria-label="Using (inference)" className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <h4 className="flex items-center gap-2 font-semibold text-white">
            <Cpu size={15} /> Using (every request)
          </h4>
          <p className="text-sm text-slate-300">The weights are frozen. Each new token is one forward pass through all the layers, repeated until the answer ends.</p>
          <Stat label="Compute per generated token (≈ 2 · params)" value={`${sci(tokenFlops)} FLOPs`} />
          <Stat label="Training ÷ one token" value={sci(trainFlops / tokenFlops)} sub={`training costs as much as generating ${short(trainFlops / tokenFlops)} tokens`} />
        </section>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        FLOP formulas are the standard estimates from Kaplan et al. (2020), applied to the exact parameter count. Part III is about training;
        Part IV is about using models efficiently.
      </p>
    </Panel>
  );
}
