import { useState } from "react";
import { Bar, Panel, Slider } from "../../components/ui";
import type { StageProps } from "../../core/types";
import { scaled } from "./model";

export function Stage({ step }: StageProps) {
  const [intensity, setIntensity] = useState(50);
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <Panel title={step.view === "intro" ? "Visual" : "Deeper visual"}>
        <Bar label="intensity" value={scaled(intensity)} display={`${intensity}%`} color="#a78bfa" />
      </Panel>
      <Panel title="Controls">
        <Slider label="Intensity" value={intensity} min={0} max={100} onChange={setIntensity} format={(v) => `${v}%`} />
      </Panel>
    </div>
  );
}
