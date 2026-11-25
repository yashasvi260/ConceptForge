import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App, { AUTOPLAY_MS } from "./App";
import { SUBJECTS } from "./core/registry";
import { LAST_SUBJECT_KEY, PROGRESS_KEY } from "./core/storage";

const first = SUBJECTS[0]!;
const total = first.steps.length;
const counter = (i: number) => new RegExp(`Step ${i} / ${total}`);
const stepTitle = () => screen.getByRole("heading", { level: 2 }).textContent;

describe("App shell", () => {
  it("starts on the first subject and step", () => {
    render(<App />);
    expect(stepTitle()).toBe(first.steps[0]!.title);
    expect(screen.getByText(counter(1))).toBeInTheDocument();
  });

  it("steps with the arrow keys and buttons, and mirrors the step in the URL", async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(await screen.findByRole("heading", { level: 2, name: first.steps[1]!.title })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowLeft" }); // clamps at 0
    expect(await screen.findByRole("heading", { level: 2, name: first.steps[0]!.title })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByText(counter(2))).toBeInTheDocument();
    const last = first.steps[total - 1]!;
    await userEvent.click(screen.getByRole("button", { name: `Go to step ${total}: ${last.title}` }));
    expect(await screen.findByRole("heading", { level: 2, name: last.title })).toBeInTheDocument();
    expect(window.location.hash).toBe(`#/${first.id}/${total}`);
    expect(JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "{}")[first.id].lastStep).toBe(total - 1);
  });

  it("ignores arrow keys typed into a text field", () => {
    render(
      <>
        <App />
        <input aria-label="probe" />
      </>,
    );
    fireEvent.keyDown(screen.getByRole("textbox", { name: "probe" }), { key: "ArrowRight" });
    expect(screen.getByText(counter(1))).toBeInTheDocument();
  });

  // Needs a third step so auto-play is still running after one advance.
  it.skipIf(total < 3)("Space toggles auto-play, which advances on a timer", () => {
    vi.useFakeTimers();
    try {
      render(<App />);
      fireEvent.keyDown(window, { key: " ", code: "Space" });
      expect(screen.getByRole("button", { name: "Pause auto-play" })).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_MS + 10);
      });
      expect(screen.getByText(counter(2))).toBeInTheDocument();
      fireEvent.keyDown(window, { key: " ", code: "Space" });
      expect(screen.getByRole("button", { name: "Start auto-play" })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("opens a subject and step from the URL hash", () => {
    window.location.hash = `#/${first.id}/2`;
    render(<App />);
    expect(stepTitle()).toBe(first.steps[1]!.title);
  });

  it("falls back to the first subject for a deleted subject in the hash or storage", () => {
    window.location.hash = "#/transformers/3";
    window.localStorage.setItem(LAST_SUBJECT_KEY, "transformers");
    render(<App />);
    expect(stepTitle()).toBe(first.steps[0]!.title);
  });

  it("lists subjects under their stage in the subject menu", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Choose a topic/ }));
    const group = screen.getByRole("group", { name: first.category });
    expect(within(group).getByRole("menuitem", { name: new RegExp(first.title) })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("group", { name: first.category })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Choose a topic/ }));
    await userEvent.click(screen.getByRole("menuitem", { name: new RegExp(first.title) }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows the step's key takeaway when it has one", () => {
    const withTakeaway = first.steps.findIndex((s) => s.keyTakeaway);
    if (withTakeaway < 0) return;
    window.location.hash = `#/${first.id}/${withTakeaway + 1}`;
    render(<App />);
    expect(screen.getByRole("note", { name: "Key takeaway" })).toHaveTextContent(first.steps[withTakeaway]!.keyTakeaway!.replace(/`/g, ""));
  });
});
