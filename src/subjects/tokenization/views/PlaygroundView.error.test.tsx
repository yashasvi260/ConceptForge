import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../realTokenizers", async (orig) => ({
  ...(await orig<typeof import("../realTokenizers")>()),
  loadEncoder: () => Promise.reject(new Error("offline")),
}));

const { PlaygroundView } = await import("./PlaygroundView");

describe("playground when the vocabulary can't load", () => {
  it("shows a readable error with a retry button", async () => {
    render(<PlaygroundView />);
    expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Retry/ }).length).toBeGreaterThan(0);
  });
});
