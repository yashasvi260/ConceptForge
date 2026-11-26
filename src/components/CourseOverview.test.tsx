import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SUBJECTS } from "../core/registry";
import { emptyProgress, type ProgressMap } from "../core/storage";
import { PART_TITLES } from "../core/track";
import { CourseOverview } from "./CourseOverview";

const [m1, m2] = SUBJECTS;
const completeOf = (id: string): ProgressMap => {
  const s = SUBJECTS.find((x) => x.id === id)!;
  return { [id]: { ...emptyProgress(), visitedSteps: s.steps.map((x) => x.id), attempts: 1 } };
};
const card = (title: string) => screen.getByRole("button", { name: new RegExp(`^Module \\d\\d.*${title}`) });

describe("CourseOverview", () => {
  it("shows 0 / 18 and Start Module 01 when new", () => {
    render(<CourseOverview subjects={SUBJECTS} progress={{}} onOpenModule={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: "LLM Mastery" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Course completion" })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("0 / 18 modules · 0%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Module 01 →" })).toBeInTheDocument();
  });

  it("marks complete, in progress and up next", () => {
    const progress: ProgressMap = {
      ...completeOf(m1!.id),
      [SUBJECTS[2]!.id]: { ...emptyProgress(), visitedSteps: [SUBJECTS[2]!.steps[0]!.id] },
    };
    render(<CourseOverview subjects={SUBJECTS} progress={progress} onOpenModule={vi.fn()} />);
    expect(within(card(m1!.title)).getByText("✓ Completed")).toBeInTheDocument();
    expect(within(card(m2!.title)).getByText("▶ Up next")).toBeInTheDocument();
    expect(within(card(SUBJECTS[2]!.title)).getByText(`1/${SUBJECTS[2]!.steps.length} steps`)).toBeInTheDocument();
    expect(screen.getByText("1 / 18 modules · 6%")).toBeInTheDocument();
  });

  it("shows coming soon for unbuilt modules without a button", () => {
    render(<CourseOverview subjects={SUBJECTS} progress={{}} onOpenModule={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Evals, Guardrails/ })).not.toBeInTheDocument();
    const part4 = screen.getByRole("region", { name: PART_TITLES[4] });
    expect(within(part4).getAllByText("Coming soon")).toHaveLength(3);
  });

  it("Resume opens the up-next module", async () => {
    const onOpen = vi.fn();
    render(<CourseOverview subjects={SUBJECTS} progress={completeOf(m1!.id)} onOpenModule={onOpen} />);
    await userEvent.click(screen.getByRole("button", { name: `Resume: 02. ${m2!.title} →` }));
    expect(onOpen).toHaveBeenCalledWith(m2!.id);
  });

  it("module cards open their module", async () => {
    const onOpen = vi.fn();
    render(<CourseOverview subjects={SUBJECTS} progress={{}} onOpenModule={onOpen} />);
    await userEvent.click(card(m2!.title));
    expect(onOpen).toHaveBeenCalledWith(m2!.id);
  });

  it("part counts", () => {
    render(<CourseOverview subjects={SUBJECTS} progress={completeOf(m1!.id)} onOpenModule={vi.fn()} />);
    expect(within(screen.getByRole("region", { name: PART_TITLES[1] })).getByText("1 / 5 modules completed")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: PART_TITLES[4] })).getByText("0 / 3 modules completed")).toBeInTheDocument();
  });
});
