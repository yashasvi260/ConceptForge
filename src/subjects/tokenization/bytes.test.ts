import { describe, expect, it } from "vitest";
import { byteTable, utf8Bytes } from "./bytes";

describe("bytes", () => {
  it("counts UTF-8 bytes per character", () => {
    expect(utf8Bytes("a")).toEqual([0x61]);
    expect(utf8Bytes("é")).toHaveLength(2);
    expect(utf8Bytes("你")).toHaveLength(3);
    expect(utf8Bytes("🤖")).toEqual([0xf0, 0x9f, 0xa4, 0x96]);
  });

  it("iterates code points, not UTF-16 halves", () => {
    expect(byteTable("a🤖")).toEqual([
      { char: "a", bytes: [0x61] },
      { char: "🤖", bytes: [0xf0, 0x9f, 0xa4, 0x96] },
    ]);
    expect(byteTable("")).toEqual([]);
  });
});
