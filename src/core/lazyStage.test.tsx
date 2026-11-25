import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OllamaProvider } from "../llm/OllamaContext";
import { SUBJECTS } from "./registry";

describe("heavy modules load their stage lazily", () => {
  it.each(["04-text-classification", "05-clustering-topics", "06-prompt-engineering"])("%s shows a placeholder, then the stage", async (id) => {
    const s = SUBJECTS.find((x) => x.id === id)!;
    render(
      <OllamaProvider>
        <s.Stage step={s.steps[0]!} stepIndex={0} />
      </OllamaProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading lesson…");
    expect(await screen.findByText(new RegExp(s.id === "06-prompt-engineering" ? "turn a ticket into data" : s.id === "05-clustering-topics" ? "no labels" : "route bank support tickets", "i"))).toBeInTheDocument();
  });
});
