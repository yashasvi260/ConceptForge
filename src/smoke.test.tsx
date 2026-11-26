/**
 * End-to-end smoke test: every subject, every step, every control, every challenge —
 * and no console errors or warnings along the way.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { SUBJECTS } from "./core/registry";

let errors: unknown[][] = [];

beforeEach(() => {
  errors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void errors.push(args));
  vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => void errors.push(args));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function stage() {
  return screen.queryByRole("main", { name: "Interactive stage" }) ?? screen.getByRole("region", { name: "Interactive stage" });
}

/** Click every switch/radio/preset and nudge every slider inside the stage. */
function exerciseControls() {
  const s = stage();
  for (const sw of within(s).queryAllByRole("switch")) {
    act(() => fireEvent.click(sw));
    act(() => fireEvent.click(sw));
  }
  for (const radio of within(s).queryAllByRole("radio")) act(() => fireEvent.click(radio));
  for (const slider of within(s).queryAllByRole("slider")) {
    const el = slider as HTMLInputElement;
    for (const v of [el.min, el.max, String((Number(el.min) + Number(el.max)) / 2)]) {
      act(() => fireEvent.change(el, { target: { value: v } }));
    }
  }
  for (const select of within(s).queryAllByRole("combobox")) {
    const options = within(select).getAllByRole("option") as HTMLOptionElement[];
    act(() => fireEvent.change(select, { target: { value: options.at(-1)!.value } }));
  }
  for (const btn of within(s).queryAllByRole("button")) {
    if (btn.hasAttribute("disabled") || btn.getAttribute("role")) continue;
    act(() => fireEvent.click(btn));
  }
}

describe("smoke: every subject and step", () => {
  it.each(SUBJECTS.map((s) => [s.id, s] as const))("%s renders and responds on every step", async (_id, subject) => {
    window.location.hash = `#/${subject.id}/1`;
    render(<App />);
    for (let i = 0; i < subject.steps.length; i++) {
      expect(screen.getByText(new RegExp(`Step ${i + 1} / ${subject.steps.length}`))).toBeInTheDocument();
      // Deep lessons download on demand; wait until the page (and its stage) is there.
      if (subject.steps[i]!.deep) await screen.findByRole("heading", { level: 3, name: "1 · Why it exists" });
      exerciseControls();
      // After poking controls the stage must still be on screen.
      expect(stage().textContent?.length ?? 0).toBeGreaterThan(20);
      act(() => fireEvent.keyDown(window, { key: "ArrowRight" }));
    }
    expect(screen.getByRole("button", { name: "Take Practice Check ✓" })).toBeEnabled();
    expect(errors).toEqual([]);
  });
});

describe("smoke: every challenge", () => {
  it.each(SUBJECTS.map((s) => [s.id, s] as const))("%s challenge runs to a perfect score", async (_id, subject) => {
    window.location.hash = `#/${subject.id}/challenge`;
    render(<App />);
    for (const item of subject.challenges) {
      // The next question mounts once the previous one has animated out.
      await screen.findByRole("button", { name: "Check answer" });
      const correctText = item.options[item.correctIndex]!.replace(/`/g, "");
      const options = within(screen.getByRole("radiogroup", { name: "Answer options" })).getAllByRole("radio");
      const correct = options.find((o) => o.textContent?.slice(1) === correctText);
      expect(correct, `option "${correctText}"`).toBeDefined();
      act(() => fireEvent.click(correct!));
      act(() => fireEvent.click(screen.getByRole("button", { name: "Check answer" })));
      expect(screen.getByRole("status")).toHaveTextContent("Correct!");
      act(() => fireEvent.click(screen.getByRole("button", { name: /Next question|See results/ })));
    }
    expect(await screen.findByTestId("challenge-score")).toHaveTextContent(
      `${subject.challenges.length} / ${subject.challenges.length} (100%)`,
    );
    expect(errors).toEqual([]);
  });
});
