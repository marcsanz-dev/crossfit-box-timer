import { customAlphabet } from "nanoid";
import { describe, expect, it } from "vitest";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  formatCode,
  isValidCode,
  normalizeCode,
} from "./code";

describe("share codes", () => {
  it("uses an alphabet without look-alike characters", () => {
    for (const ambiguous of ["0", "O", "1", "I", "L"]) {
      expect(CODE_ALPHABET).not.toContain(ambiguous);
    }
    expect(new Set(CODE_ALPHABET).size).toBe(CODE_ALPHABET.length);
  });

  it("generates valid codes with the production generator", () => {
    const generate = customAlphabet(CODE_ALPHABET, CODE_LENGTH);
    for (let i = 0; i < 500; i++) expect(isValidCode(generate())).toBe(true);
  });

  it.each([
    ["k7q m4p", "K7QM4P"],
    ["K7Q-M4P", "K7QM4P"],
    ["  k7q·m4p ", "K7QM4P"],
  ])("normalises %j to %s", (input, expected) => {
    expect(normalizeCode(input)).toBe(expected);
  });

  it.each(["K7QM4", "K7QM4PX", "K7QM4O", "K7Q1M4", "K7Q M4P", ""])(
    "rejects %j",
    (code) => {
      expect(isValidCode(code)).toBe(false);
    },
  );

  it("formats codes in two groups of three", () => {
    expect(formatCode("K7QM4P")).toBe("K7Q M4P");
  });
});
