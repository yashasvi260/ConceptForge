import { useState } from "react";
import type { StageProps } from "../../core/types";
import { TICKETS, type Combo } from "./prompts";
import type { ModelChoice } from "./useExperiment";
import { BuilderView, InspectorView } from "./views/BuilderViews";
import { AnatomyView, ChainView, CompareView, IntroView, RecapView } from "./views/LessonViews";

const OFF: Combo = { role: false, fewShot: false, cot: false, schema: false };

export function Stage({ step }: StageProps) {
  const [combo, setCombo] = useState<Combo>(OFF);
  const [ticketId, setTicketId] = useState(TICKETS[0]!.id);
  const [model, setModel] = useState<ModelChoice>("gemma");
  const t = { ticketId, setTicketId, model, setModel };
  switch (step.view) {
    case "intro":
      return <IntroView />;
    case "anatomy":
      return <AnatomyView />;
    case "fewshot":
      return <CompareView a={OFF} b={{ ...OFF, fewShot: true }} labels={["Zero-shot", "Few-shot (2 examples)"]} {...t} />;
    case "role":
      return <CompareView a={OFF} b={{ ...OFF, role: true }} labels={["No role", "With a role"]} {...t} />;
    case "cot":
      return <CompareView a={OFF} b={{ ...OFF, cot: true }} labels={["Direct answer", "Chain-of-thought"]} {...t} />;
    case "schema":
      return <CompareView a={OFF} b={{ ...OFF, schema: true }} labels={["Format in words", "JSON schema enforced"]} {...t} />;
    case "builder":
      return <BuilderView combo={combo} setCombo={setCombo} {...t} />;
    case "inspector":
      return <InspectorView combo={combo} {...t} />;
    case "chain":
      return <ChainView ticketId={ticketId} setTicketId={setTicketId} />;
    case "recap":
      return <RecapView />;
    default:
      return null;
  }
}
