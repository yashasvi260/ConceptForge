import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ByteStandinsLab, ByteTaxLab, StreamDecodeLab, WpFertilityLab, WpScoreLab, WpUnkLab, bytesToUnicode } from "./BytesWordPieceLabs";

describe("Module 02 bytes and WordPiece labs", () => {
  it("bytes_to_unicode: 256 distinct stand-ins; space → Ġ, newline → Ċ", () => {
    const m = bytesToUnicode();
    expect(new Set(m.values()).size).toBe(256);
    expect(m.get(32)).toBe("Ġ");
    expect(m.get(10)).toBe("Ċ");
  });

  it("Stand-ins: prints text the way GPT-2's vocabulary files do", () => {
    render(<ByteStandinsLab />);
    expect(screen.getByRole("status")).toHaveTextContent("ĠtheĠcatĊsatĠÃ©");
  });

  it("Byte tax: Hindi goes from 2.4 to 7.7 bytes per token", () => {
    render(<ByteTaxLab />);
    expect(screen.getByRole("status")).toHaveTextContent("Hindi: 2.4 bytes per token with GPT-4, 7.7 with GPT-4o");
  });

  it("Streaming: GPT-4's robot emoji only appears once all three tokens have arrived", async () => {
    render(<StreamDecodeLab />);
    const next = screen.getByRole("button", { name: /Next token/ });
    await userEvent.click(next);
    expect(screen.getByRole("status")).toHaveTextContent("—");
    await userEvent.click(next);
    await userEvent.click(next);
    expect(screen.getByRole("status")).toHaveTextContent("🤖");
  });

  it("WordPiece score: BPE starts with e + s, WordPiece with i + d", () => {
    render(<WpScoreLab />);
    expect(screen.getByRole("status")).toHaveTextContent("BPE merges e + s first; WordPiece merges i + d first.");
  });

  it("[UNK] and fertility use BERT's real vocabulary", async () => {
    render(<WpUnkLab />);
    expect(await screen.findByText(/\[UNK\]\. The word around/, {}, { timeout: 20000 })).toBeInTheDocument();
    render(<WpFertilityLab />);
    expect(await screen.findByText("ku ##ber ##net ##es", {}, { timeout: 20000 })).toBeInTheDocument();
  }, 40000);
});
