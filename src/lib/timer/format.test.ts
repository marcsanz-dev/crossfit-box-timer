import { describe, expect, it } from "vitest";
import { getDisplayState } from "./display";
import { formatClock, formatMinutes, getClockText } from "./format";
import { workoutSchema, type WorkoutInput } from "./schema";
import { buildTimeline } from "./timeline";

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

describe("formatMinutes", () => {
  it("shows whole minutes as a number and the rest as m:ss", () => {
    expect(formatMinutes(720)).toBe("12");
    expect(formatMinutes(90)).toBe("1:30");
  });
});

describe("getClockText", () => {
  const textAt = (input: WorkoutInput, elapsedMs: number) => {
    const workout = workoutSchema.parse(input);
    return getClockText(
      workout,
      getDisplayState(buildTimeline(workout), elapsedMs),
    );
  };

  it("shows bare seconds during prep", () => {
    expect(textAt({ mode: "forTime", capSeconds: 600 }, 2_000)).toBe("8");
  });

  it("pads minutes for workouts of 10 minutes or more", () => {
    expect(textAt({ mode: "forTime", capSeconds: 600 }, 15_000)).toBe("00:05");
    expect(textAt({ mode: "amrap", durationSeconds: 720 }, 10_000)).toBe(
      "12:00",
    );
  });

  it("does not pad shorter workouts", () => {
    expect(textAt({ mode: "amrap", durationSeconds: 300 }, 10_000)).toBe(
      "5:00",
    );
  });

  it("shows bare seconds for EMOM intervals of up to a minute", () => {
    expect(
      textAt({ mode: "emom", intervalSeconds: 60, rounds: 10 }, 10_000),
    ).toBe("60");
    expect(
      textAt({ mode: "emom", intervalSeconds: 60, rounds: 10 }, 45_000),
    ).toBe("25");
  });

  it("uses m:ss for longer EMOM intervals", () => {
    expect(
      textAt({ mode: "emom", intervalSeconds: 120, rounds: 5 }, 25_000),
    ).toBe("1:45");
  });
});
