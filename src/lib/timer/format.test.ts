import { describe, expect, it } from "vitest";
import { formatClock } from "./format";

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [9, "0:09"],
    [60, "1:00"],
    [462, "7:42"],
    [3600, "60:00"],
  ])("formats %i s as %s", (seconds, expected) => {
    expect(formatClock(seconds)).toBe(expected);
  });

  it("pads minutes when asked, to keep a stable width", () => {
    expect(formatClock(462, true)).toBe("07:42");
    expect(formatClock(600, true)).toBe("10:00");
  });

  it("clamps negatives and drops fractions", () => {
    expect(formatClock(-3)).toBe("0:00");
    expect(formatClock(59.9)).toBe("0:59");
  });
});
