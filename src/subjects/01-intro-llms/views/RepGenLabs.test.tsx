import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import * as m06 from "../../06-text-classification/model";
import { CentroidLab, ChooseLab, CombineLab, CostGapLab, GenClassifyLab, TwoOutputsLab } from "./RepGenLabs";

const load = () => Promise.resolve(m06);
const setSlider = (name: string, value: string) => {
  const s = screen.getByRole("slider", { name });
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(s, value);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("representation vs generative labs", () => {
  it("Two outputs: a vector and gemma4's real one-word answer", async () => {
    render(<TwoOutputsLab load={load} />);
    expect(await screen.findByText(/probability .* ms on the recording GPU/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("card");
  });

  it("Centroid: 17/20 with 8 examples per class, 12/20 with 1", async () => {
    render(<CentroidLab load={load} />);
    expect(await screen.findByText(/17 \/ 20/)).toBeInTheDocument();
    setSlider("Training examples per class", "1");
    expect(screen.getByRole("status")).toHaveTextContent("12 / 20");
  });

  it("Generative: gemma4 got all 20 recorded test tickets right", async () => {
    render(<GenClassifyLab load={load} />);
    expect(await screen.findByText("20 / 20 correct (100.0%)")).toBeInTheDocument();
  });

  it("Cost gap: shows gemma4's measured time per answer", async () => {
    render(<CostGapLab load={load} />);
    expect(await screen.findByText("84.2 ms")).toBeInTheDocument();
  });

  it("Choose: needing text out points to a generative model", async () => {
    render(<ChooseLab />);
    expect(screen.getByRole("status")).toHaveTextContent("representation model");
    await userEvent.click(screen.getByRole("switch", { name: /explanation or reply/ }));
    expect(screen.getByRole("status")).toHaveTextContent("A generative model");
  });

  it("Combine: retrieves 3 real neighbours and builds the prompt", async () => {
    render(<CombineLab load={load} />);
    const bars = await screen.findByRole("list", { name: /closest past tickets/ });
    expect(within(bars).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("status")).toHaveTextContent("New ticket:");
  });
});
