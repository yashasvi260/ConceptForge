import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SubjectModule } from "../core/types";
import { emptyProgress } from "../core/storage";
import template from "../subjects/_template";
import { ChallengeRunner, shuffledOrder } from "./ChallengeRunner";

const subject: SubjectModule = {
  ...template,
  challenges: [
    { id: "a", prompt: "1 + 1?", options: ["2", "3"], correctIndex: 0, explanation: "Maths.", relatedStepId: "intro", hint: "Count on your fingers." },
    { id: "b", prompt: "Sky colour?", options: ["green", "blue"], correctIndex: 1, explanation: "Rayleigh.", relatedStepId: "deeper" },
  ],
};

const answer = async (label: string) => {
  await screen.findByRole("button", { name: "Check answer" });
  fireEvent.click(within(screen.getByRole("radiogroup")).getByRole("radio", { name: new RegExp(label) }));
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
};

describe("ChallengeRunner", () => {
  it("scores answers, explains them and links missed questions back to their step", async () => {
    const onFinish = vi.fn();
    const onReviewStep = vi.fn();
    render(<ChallengeRunner subject={subject} progress={emptyProgress()} onFinish={onFinish} onReviewStep={onReviewStep} />);

    expect(screen.getByRole("button", { name: "Check answer" })).toBeDisabled();
    await answer("2");
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));

    await answer("green");
    expect(screen.getByRole("status")).toHaveTextContent("Not quite.");
    expect(screen.getByRole("status")).toHaveTextContent("Rayleigh.");
    fireEvent.click(screen.getByRole("button", { name: "See results" }));

    expect(onFinish).toHaveBeenCalledWith(1, 2);
    expect(screen.getByTestId("challenge-score")).toHaveTextContent("1 / 2 (50%)");
    fireEvent.click(screen.getByRole("button", { name: /Review “Going deeper”/ }));
    expect(onReviewStep).toHaveBeenCalledWith("deeper");

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText(/Question 1 of 2/)).toBeInTheDocument();
  });

  it("handles a subject with no challenges", () => {
    render(
      <ChallengeRunner subject={{ ...subject, challenges: [] }} progress={emptyProgress()} onFinish={vi.fn()} onReviewStep={vi.fn()} />,
    );
    expect(screen.getByText(/no challenges yet/)).toBeInTheDocument();
  });

  it("shuffles answer order with a valid permutation", () => {
    for (const r of [0, 0.3, 0.99]) {
      expect([...shuffledOrder(4, () => r)].sort()).toEqual([0, 1, 2, 3]);
    }
    const firsts = new Set(Array.from({ length: 40 }, () => shuffledOrder(4)[0]));
    expect(firsts.size).toBeGreaterThan(1);
  });

  it("reveals a hint without moving or revealing the answer", async () => {
    render(
      <ChallengeRunner subject={subject} progress={emptyProgress()} onFinish={vi.fn()} onReviewStep={vi.fn()} random={() => 0.42} />,
    );
    await screen.findByRole("button", { name: "Check answer" });
    const before = within(screen.getByRole("radiogroup")).getAllByRole("radio").map((r) => r.textContent);
    expect(screen.queryByText("Count on your fingers.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show hint" }));
    expect(screen.getByText("Count on your fingers.")).toBeInTheDocument();
    const after = within(screen.getByRole("radiogroup")).getAllByRole("radio").map((r) => r.textContent);
    expect(after).toEqual(before);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check answer" })).toBeDisabled();
  });

  it("has no hint button when the question has no hint", async () => {
    render(
      <ChallengeRunner subject={{ ...subject, challenges: [subject.challenges[1]!] }} progress={emptyProgress()} onFinish={vi.fn()} onReviewStep={vi.fn()} />,
    );
    await screen.findByRole("button", { name: "Check answer" });
    expect(screen.queryByRole("button", { name: "Show hint" })).not.toBeInTheDocument();
  });
});
