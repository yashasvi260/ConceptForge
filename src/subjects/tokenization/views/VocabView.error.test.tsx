import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../realTokenizers", async (orig) => ({
  ...(await orig<typeof import("../realTokenizers")>()),
  loadEncoder: () => Promise.reject(new Error("offline")),
}));

const { VocabView } = await import("./VocabView");

describe("F3: Vocabulary step when the tokenizer can't load", () => {
  it("shows an error with Retry instead of loading forever, and still works for bytes", async () => {
    render(<VocabView text="hello" setText={() => {}} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/reload/i);
    expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Bytes/ }));
    expect(screen.getByTestId("vocab-token-count")).toHaveTextContent("5");
  });
});
