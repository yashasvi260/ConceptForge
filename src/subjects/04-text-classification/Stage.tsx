import { useState } from "react";
import type { StageProps } from "../../core/types";
import { LABELS, TEST_TICKETS } from "./model";
import { ChooseView, HeadView, IntroView, RecapView } from "./views/BasicsViews";
import { CompareView } from "./views/CompareView";
import { ConfidenceView, GenerativeView } from "./views/GenerativeView";
import { TrainView } from "./views/TrainView";
import { ZeroShotView, type Descriptions } from "./views/ZeroShotView";

const DEFAULT_DESCRIPTIONS: Descriptions = Object.fromEntries(LABELS.map((l) => [l.id, l.description]));

export function Stage({ step }: StageProps) {
  // Shared across steps: the ticket under study and the zero-shot label descriptions.
  const [ticketId, setTicketId] = useState(TEST_TICKETS[0]!.id);
  const [descriptions, setDescriptions] = useState<Descriptions>(DEFAULT_DESCRIPTIONS);
  const shared = { ticketId, setTicketId };
  switch (step.view) {
    case "intro":
      return <IntroView />;
    case "head":
      return <HeadView />;
    case "train":
      return <TrainView />;
    case "zeroshot":
      return <ZeroShotView {...shared} descriptions={descriptions} setDescriptions={setDescriptions} />;
    case "generative":
      return <GenerativeView {...shared} />;
    case "confidence":
      return <ConfidenceView {...shared} descriptions={descriptions} />;
    case "compare":
      return <CompareView {...shared} descriptions={descriptions} />;
    case "choose":
      return <ChooseView />;
    case "recap":
      return <RecapView />;
    default:
      return null;
  }
}
