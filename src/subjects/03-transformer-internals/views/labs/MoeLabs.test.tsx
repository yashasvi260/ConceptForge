import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MoeBalanceLab, MoeMemoryLab, MoeParamsLab, MoeRouterLab, moeCounts, routeTopK, switchLoss } from "./MoeLabs";

describe("Module 03 Mixture-of-Experts labs", () => {
  it("moeCounts reproduces Mixtral 8x7B exactly", () => {
    expect(moeCounts(8, 2)).toEqual({ total: 46_702_792_704, active: 12_879_925_248 });
    const dense = moeCounts(8, 8);
    expect(dense.active).toBe(dense.total);
  });

  it("Total vs active: Mixtral's 8 experts, 2 per token → 28% active", () => {
    render(<MoeParamsLab />);
    expect(screen.getByRole("status")).toHaveTextContent("8 experts, 2 per token: 46,702,792,704 parameters stored, 12,879,925,248 used per token (28%).");
    fireEvent.change(screen.getByRole("slider", { name: "Experts per block" }), { target: { value: "16" } });
    expect(screen.getByRole("status")).toHaveTextContent("16 experts, 2 per token");
    expect(screen.getByRole("status")).toHaveTextContent("91,800,997,888 parameters stored, 12,880,973,824 used per token (14%)");
  });

  it("Router: ' loan' runs experts 2 and 5 with weights 0.550 / 0.450", async () => {
    expect(routeTopK([1.2, -0.3, 2.1, 0.4, -1.0, 1.9, 0.0, -0.5], 2).top).toEqual([2, 5]);
    render(<MoeRouterLab />);
    expect(screen.getByRole("status")).toHaveTextContent('" loan" → experts 2 and 5 with weights 0.550 / 0.450; 6 experts skipped.');
    await userEvent.click(screen.getByRole("radio", { name: "1" }));
    expect(screen.getByRole("status")).toHaveTextContent('" loan" → experts 2 with weights 1.000; 7 experts skipped.');
  });

  it("Load balancing: 1.0 when even, 4.0 when every token goes to one expert", () => {
    expect(switchLoss(0.25)).toBeCloseTo(1);
    expect(switchLoss(1)).toBeCloseTo(4);
    render(<MoeBalanceLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Balancing loss = 4 × Σ fᵢ·Pᵢ = 1.000 (perfectly even: the minimum)");
  });

  it("Memory: Mixtral needs 93.4 GB; the dense equivalent 25.8 GB", () => {
    render(<MoeMemoryLab />);
    expect(screen.getByRole("status")).toHaveTextContent("On 24 GB: Mixtral's weights (93.4 GB) doesn't fit; a dense model doing the same work per token (25.8 GB) doesn't fit.");
  });
});
