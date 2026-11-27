import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CacheTwinLab, SettingsMapLab, StepTraceLab, twinGenerate } from "./RecapLabs";

describe("Module 04 recap labs", () => {
  it("One step: at Ollama's defaults 18 tokens survive and ' the' is drawn 24.0% of the time", async () => {
    render(<StepTraceLab />);
    expect(screen.getByRole("status")).toHaveTextContent(/^At T 0\.8, top-k 40, top-p 0\.9: 18 tokens can be drawn; " the" 24\.0%, " Paris" \d+\.\d%\.$/);
    expect(screen.getByText(/" the" 16\.7% of all 50,257/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Draw 20 tokens" }));
    expect(screen.getByText("20 drawn")).toBeInTheDocument();
  });

  it("Cache twin: identical tokens with and without the cache; the broken cache diverges", () => {
    const plain = twinGenerate([3, 1, 4], 12, "none");
    const cached = twinGenerate([3, 1, 4], 12, "cache");
    expect(cached.ids).toEqual(plain.ids);
    expect(new Set(plain.ids).size).toBeGreaterThan(3);
    expect([cached.fed, plain.fed]).toEqual([14, 102]);
    render(<CacheTwinLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Same 12 tokens both ways; 14 tokens fed with the cache, 102 without.");
    fireEvent.click(screen.getByRole("switch", { name: "Break the cache" }));
    expect(screen.getByRole("status")).toHaveTextContent(/^The broken cache diverges at step \d+/);
  });

  it("Settings map: temperature only matters when sampling; num_predict applies to greedy too", async () => {
    render(<SettingsMapLab />);
    expect(screen.getByRole("status")).toHaveTextContent("temperature: divides the logits before softmax; 0 means greedy. Only matters when sampling");
    await userEvent.click(screen.getByRole("button", { name: "num_predict" }));
    expect(screen.getByRole("status")).toHaveTextContent("num_predict: ends the loop after this many new tokens. Applies to greedy decoding too.");
  });
});
