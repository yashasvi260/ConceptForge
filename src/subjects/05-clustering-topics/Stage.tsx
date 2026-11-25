import { useCallback, useState } from "react";
import type { StageProps } from "../../core/types";
import { DEFAULT_PARAMS, usePipeline, type ExtraDoc, type Params } from "./usePipeline";
import { AddDoc, DensityView, HdbscanView, KeywordsView, NamesView, RecapView } from "./views/ClusterViews";
import { CurseView, EmbedView, IntroView, UmapView } from "./views/MapViews";

export function Stage({ step }: StageProps) {
  // One pipeline shared by every step, so a setting changed on one step carries to the next.
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [extras, setExtras] = useState<ExtraDoc[]>([]);
  const set = useCallback((p: Partial<Params>) => setParams((old) => ({ ...old, ...p })), []);
  const add = useCallback((d: ExtraDoc) => setExtras((old) => [...old, d]), []);
  const run = usePipeline(params, extras);
  switch (step.view) {
    case "intro":
      return <IntroView />;
    case "embed":
      return <EmbedView />;
    case "curse":
      return <CurseView />;
    case "umap":
      return <UmapView xy={run.xy} docs={run.docs} nNeighbors={params.nNeighbors} minDist={params.minDist} set={set} />;
    case "density":
      return <DensityView run={run} minClusterSize={params.minClusterSize} />;
    case "hdbscan":
      return (
        <>
          <HdbscanView run={run} params={params} set={set} />
          <div className="mt-3">
            <AddDoc onAdd={add} />
          </div>
        </>
      );
    case "keywords":
      return <KeywordsView run={run} />;
    case "names":
      return <NamesView run={run} onAdd={add} />;
    case "recap":
      return <RecapView />;
    default:
      return null;
  }
}
