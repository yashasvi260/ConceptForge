import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Exercise } from "../../core/types";
import type { RunFn, RunStatus } from "../../py/client";
import type { RunRequest, RunResult } from "../../py/program";
import { PyRunnerProvider } from "../../py/PyRunnerContext";
import { CodeExercise } from "./CodeExercise";

const EX: Exercise = {
  id: "ex1",
  title: "Count things",
  packages: [],
  parts: [
    { id: "p1", prompt: "Set **x** to 2.", starter: "x = None  # TODO", solution: "x = 2", checks: "def check_x(ns): pass", hints: ["Think small.", "x = 2"] },
    { id: "p2", prompt: "Set y to x + 1.", starter: "y = None", solution: "y = x + 1", checks: "def check_y(ns): pass", hints: [] },
  ],
};

interface Call {
  req: RunRequest;
  onStatus: (s: RunStatus) => void;
  resolve: (r: RunResult) => void;
}

function fakeRunner() {
  const calls: Call[] = [];
  const run: RunFn = (req, onStatus) => new Promise<RunResult>((resolve) => calls.push({ req, onStatus, resolve }));
  return { run, calls };
}

const result = (r: Partial<RunResult>): RunResult => ({ status: "pass", stdout: "", checks: [], error: null, ...r });

function setup(passedParts: string[] = []) {
  const f = fakeRunner();
  const onPartPassed = vi.fn();
  const utils = render(
    <PyRunnerProvider run={f.run}>
      <CodeExercise exercise={EX} data={{ n: 1 }} passedParts={passedParts} onPartPassed={onPartPassed} />
    </PyRunnerProvider>,
  );
  return { ...f, onPartPassed, ...utils };
}

const part = (n: number) => screen.getByRole("group", { name: `Part ${n}` });

beforeEach(() => window.localStorage.clear());

describe("CodeExercise", () => {
  it("shows each part's prompt, starter code and controls", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Count things" })).toBeInTheDocument();
    const p1 = part(1);
    expect(within(p1).getByText("x")).toBeInTheDocument();
    expect(within(p1).getByLabelText("Code for part 1")).toHaveValue("x = None  # TODO");
    for (const b of ["Run", "Reset", "Hint", "Show solution"]) expect(within(p1).getByRole("button", { name: b })).toBeInTheDocument();
  });

  it("sends the code, checks, data and packages, and shows the loading status", async () => {
    const { calls } = setup();
    await userEvent.click(within(part(1)).getByRole("button", { name: "Run" }));
    expect(calls[0]!.req).toEqual({ learnerCode: "x = None  # TODO", prelude: "", checks: "def check_x(ns): pass", data: { n: 1 }, packages: [] });
    act(() => calls[0]!.onStatus("loading"));
    expect(within(part(1)).getByText("Loading Python (≈10 MB, first time only)")).toBeInTheDocument();
  });

  it("lists passing checks and reports the passed part", async () => {
    const { calls, onPartPassed } = setup();
    await userEvent.click(within(part(1)).getByRole("button", { name: "Run" }));
    await act(async () => calls[0]!.resolve(result({ stdout: "hello\n", checks: [{ name: "x is two", ok: true, message: "" }] })));
    expect(within(part(1)).getByText("✓ x is two")).toBeInTheDocument();
    expect(within(part(1)).getByText("hello")).toBeInTheDocument();
    expect(onPartPassed).toHaveBeenCalledWith("p1");
  });

  it("shows failing checks with their message", async () => {
    const { calls, onPartPassed } = setup();
    await userEvent.click(within(part(1)).getByRole("button", { name: "Run" }));
    await act(async () => calls[0]!.resolve(result({ status: "fail", checks: [{ name: "x is two", ok: false, message: "x should be 2" }] })));
    expect(within(part(1)).getByText("✗ x is two")).toBeInTheDocument();
    expect(within(part(1)).getByText("x should be 2")).toBeInTheDocument();
    expect(onPartPassed).not.toHaveBeenCalled();
  });

  it("shows an error from the learner's code as an alert", async () => {
    const { calls } = setup();
    await userEvent.click(within(part(1)).getByRole("button", { name: "Run" }));
    await act(async () => calls[0]!.resolve(result({ status: "error", error: "line 1: NameError: name 'z' is not defined" })));
    expect(within(part(1)).getByRole("alert")).toHaveTextContent("line 1: NameError");
  });

  it("offers Retry when Python could not load", async () => {
    const { calls } = setup();
    await userEvent.click(within(part(1)).getByRole("button", { name: "Run" }));
    await act(async () => calls[0]!.resolve(result({ status: "load-error", error: "Couldn't load Python. Check your connection." })));
    expect(within(part(1)).getByRole("alert")).toHaveTextContent("Couldn't load Python");
    await userEvent.click(within(part(1)).getByRole("button", { name: "Retry" }));
    expect(calls).toHaveLength(2);
  });

  it("reveals hints one at a time, then disables the button", async () => {
    setup();
    const hint = within(part(1)).getByRole("button", { name: "Hint" });
    await userEvent.click(hint);
    expect(within(part(1)).getByText("Think small.")).toBeInTheDocument();
    await userEvent.click(hint);
    expect(within(part(1)).getByText("x = 2", { selector: "li *, li" })).toBeInTheDocument();
    expect(hint).toBeDisabled();
  });

  it("shows the solution only after confirming, and Reset restores the starter", async () => {
    setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const box = within(part(1)).getByLabelText("Code for part 1");
    await userEvent.click(within(part(1)).getByRole("button", { name: "Show solution" }));
    expect(confirm).toHaveBeenCalledWith("Show the solution? Try a hint first.");
    expect(box).toHaveValue("x = None  # TODO");
    await userEvent.click(within(part(1)).getByRole("button", { name: "Show solution" }));
    expect(box).toHaveValue("x = 2");
    await userEvent.click(within(part(1)).getByRole("button", { name: "Reset" }));
    expect(box).toHaveValue("x = None  # TODO");
  });

  it("keeps edited code across remounts", async () => {
    const first = setup();
    const box = within(part(1)).getByLabelText("Code for part 1");
    await userEvent.clear(box);
    await userEvent.type(box, "x = 7");
    first.unmount();
    setup();
    expect(within(part(1)).getByLabelText("Code for part 1")).toHaveValue("x = 7");
  });

  it("indents with Tab instead of leaving the box", async () => {
    setup();
    const box = within(part(1)).getByLabelText("Code for part 1");
    await userEvent.clear(box);
    await userEvent.click(box);
    await userEvent.tab();
    expect(box).toHaveValue("    ");
    expect(box).toHaveFocus();
  });

  it("drops a result that arrives after the learner left the step", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const first = setup();
    await userEvent.click(within(part(1)).getByRole("button", { name: "Run" }));
    const pending = first.calls[0]!;
    first.unmount();
    await act(async () => pending.resolve(result({ checks: [{ name: "x is two", ok: true, message: "" }] })));
    expect(first.onPartPassed).not.toHaveBeenCalled();
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });

  it("runs later parts after the earlier parts' reference solutions", async () => {
    const { calls } = setup();
    expect(within(part(2)).getByText("Earlier parts run with the reference solution.")).toBeInTheDocument();
    await userEvent.click(within(part(2)).getByRole("button", { name: "Run" }));
    expect(calls[0]!.req.prelude).toBe("x = 2");
    expect(calls[0]!.req.learnerCode).toBe("y = None");
  });

  it("marks parts already passed", () => {
    setup(["p1"]);
    expect(within(part(1)).getByText("Passed")).toBeInTheDocument();
    expect(within(part(2)).queryByText("Passed")).toBeNull();
  });
});
