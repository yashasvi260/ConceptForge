import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DataVsSizeLab, MemoryLab, NeuronLab, ParamCalcLab } from "./HowLargeLabs";

const setSlider = (name: string, value: string) => {
  const s = screen.getByRole("slider", { name });
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(s, value);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("how-large labs", () => {
  it("Neuron: computes the output and a layer's parameter count", () => {
    render(<NeuronLab />);
    expect(screen.getByRole("status")).toHaveTextContent("= -0.10");
    expect(screen.getByText("2,362,368")).toBeInTheDocument();
  });

  it("Parameter calculator: GPT-2 small's settings give its exact published size, and edits change it", () => {
    render(<ParamCalcLab />);
    expect(screen.getByRole("status")).toHaveTextContent("124,439,808");
    expect(screen.getByRole("status")).toHaveTextContent("exactly GPT-2 small's published size");
    setSlider("Blocks (layers)", "24");
    expect(screen.getByRole("status")).toHaveTextContent("vs GPT-2 small");
  });

  it("Data vs size: Llama 3 8B read far more than 20 tokens per parameter", () => {
    render(<DataVsSizeLab />);
    expect(screen.getByText("1,868")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("20 tokens per parameter: close to compute-optimal");
  });

  it("Memory: Llama 3 8B in bf16 is 16.06 GB and doesn't fit 16 GB with headroom; int4 does", async () => {
    render(<MemoryLab />);
    expect(screen.getByRole("status")).toHaveTextContent("16.06 GB");
    expect(screen.getByRole("status")).toHaveTextContent("doesn't fit");
    await userEvent.click(screen.getByRole("radio", { name: "int4" }));
    expect(screen.getByRole("status")).toHaveTextContent("4.02 GB of weights: fits");
  });
});
