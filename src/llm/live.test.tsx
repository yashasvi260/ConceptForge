import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GenerationPanel } from "./GenerationPanel";
import { OLLAMA_KEY, OllamaProvider } from "./OllamaContext";
import type { RecordingFile } from "./recordings";

const file: RecordingFile = {
  model: "gemma4:12b",
  ollamaVersion: "0.40.18",
  recordedAt: "2026-11-25T20:00:00Z",
  options: { temperature: 0 },
  items: [{ key: "k", prompt: "Classify: card declined", output: "card", durationMs: 120, evalCount: 2 }],
};
const request = { model: "gemma4:12b", prompt: "Classify: card declined", temperature: 0 };

/** null = no recording for this setting. */
function setup(recording: RecordingFile["items"][number] | null = file.items[0]!) {
  return render(
    <OllamaProvider>
      <GenerationPanel file={file} recording={recording ?? undefined} live={{ request }} />
    </OllamaProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("live Ollama mode", () => {
  it("never calls fetch before Connect is clicked", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    setup();
    expect(screen.getByText("card")).toBeInTheDocument();
    expect(screen.getByText(/^recorded from gemma4:12b · temperature 0 · 2026-11-25/)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it("while recordings load, the panel says so instead of claiming there is no recording", () => {
    render(
      <OllamaProvider>
        <GenerationPanel file={file} recording={undefined} loading />
      </OllamaProvider>,
    );
    expect(screen.getByText(/Loading the recorded runs/)).toBeInTheDocument();
    expect(screen.queryByText(/No recording for this setting/)).not.toBeInTheDocument();
  });

  it("missing recording shows the no-recording note", () => {
    setup(null);
    expect(screen.getByText(/No recording for this setting/)).toBeInTheDocument();
  });

  it("connect success shows Run live and labels the live output", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url).endsWith("/api/version")
        ? new Response(JSON.stringify({ version: "0.40.18" }))
        : new Response(JSON.stringify({ response: "fraud", done: true, total_duration: 1e8, eval_count: 1 })),
    );
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Connect my Ollama" }));
    await userEvent.click(await screen.findByRole("button", { name: "Run live" }));
    expect(await screen.findByText("fraud")).toBeInTheDocument();
    expect(screen.getByText(/live from gemma4:12b/)).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("http://localhost:11434/api/version", expect.anything());
  });

  it("a live answer disappears when the request changes (never shown for another setting)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url).endsWith("/api/version")
        ? new Response(JSON.stringify({ version: "0.40.18" }))
        : new Response(JSON.stringify({ response: "fraud", done: true, total_duration: 1e8, eval_count: 1 })),
    );
    const view = render(
      <OllamaProvider>
        <GenerationPanel file={file} recording={file.items[0]} live={{ request }} />
      </OllamaProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Connect my Ollama" }));
    await userEvent.click(await screen.findByRole("button", { name: "Run live" }));
    expect(await screen.findByText(/live from gemma4:12b/)).toBeInTheDocument();
    view.rerender(
      <OllamaProvider>
        <GenerationPanel file={file} recording={undefined} live={{ request: { ...request, prompt: "Classify: another ticket" } }} />
      </OllamaProvider>,
    );
    expect(screen.queryByText(/live from gemma4:12b/)).not.toBeInTheDocument();
  });

  it("connect failure keeps recordings and explains OLLAMA_ORIGINS", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Connect my Ollama" }));
    expect(await screen.findByText(/OLLAMA_ORIGINS/)).toBeInTheDocument();
    expect(screen.getByText("card")).toBeInTheDocument();
  });

  it("remembers the endpoint", async () => {
    setup();
    const field = screen.getByRole("textbox", { name: "Ollama address" });
    await userEvent.clear(field);
    await userEvent.type(field, "http://192.168.1.5:11434");
    expect(window.localStorage.getItem(OLLAMA_KEY)).toBe("http://192.168.1.5:11434");
  });
});
