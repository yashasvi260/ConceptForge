import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ContrastiveLab, DenseSparseLab, EmbedVsLlmLab, NeighboursLab, PoolingLossLab, contrastiveStep } from "./DenseLabs";

describe("dense-embedding labs", () => {
  it("contrastive steps pull related pairs closer", () => {
    const p: [number, number][] = [[-0.8, 0.7], [0.7, -0.6], [0.6, 0.8], [-0.7, -0.8], [0.1, 0.9], [0.2, -0.9]];
    const d = (q: [number, number][]) => Math.hypot(q[0]![0] - q[1]![0], q[0]![1] - q[1]![1]);
    let q = p;
    for (let i = 0; i < 10; i++) q = contrastiveStep(q, 0.08);
    expect(d(q)).toBeLessThan(d(p));
  });

  it("Dense vs sparse: almost all of MiniLM's 384 numbers are non-zero", () => {
    render(<DenseSparseLab />);
    expect(screen.getByRole("status")).toHaveTextContent("381 non-zero of 384");
  });

  it("Contrastive: training reduces the related-pair distance", async () => {
    render(<ContrastiveLab />);
    const before = Number(screen.getByRole("status").textContent!.match(/([\d.]+)$/)![1]);
    await userEvent.click(screen.getByRole("button", { name: /Train 5 steps/ }));
    const after = Number(screen.getByRole("status").textContent!.match(/([\d.]+)$/)![1]);
    expect(after).toBeLessThan(before);
  });

  it("Neighbours: 'reset my password' is nearest to 'forgot my login details'", () => {
    render(<NeighboursLab />);
    const first = within(screen.getByRole("list", { name: "Most similar first" })).getAllByRole("listitem")[0]!;
    expect(first).toHaveTextContent("I forgot my login details");
    expect(first).toHaveTextContent("0.587");
  });

  it("Pooling: the average is the same in either order", async () => {
    render(<PoolingLossLab />);
    const before = screen.getByRole("status").textContent;
    await userEvent.click(screen.getByRole("button", { name: /Swap to/ }));
    expect(screen.getByRole("status").textContent).toBe(before);
    expect(screen.getByText("0.906")).toBeInTheDocument();
  });

  it("Embed vs LLM: MiniLM's exact size and the size ratio", () => {
    render(<EmbedVsLlmLab />);
    expect(screen.getByText("22,713,216")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("524×");
  });
});
