import { describe, expect, it } from "vitest";
import { getDisplayState } from "./display";
import { workoutSchema, type WorkoutInput } from "./schema";
import { buildTimeline } from "./timeline";
import { getTone } from "./tone";

const toneAt = (input: WorkoutInput, elapsedMs: number, paused = false) => {
  const workout = workoutSchema.parse(input);
  return getTone(
    workout,
    getDisplayState(buildTimeline(workout), elapsedMs),
    paused,
  );
};

const forTime: WorkoutInput = { mode: "forTime", capSeconds: 600 };
const amrap: WorkoutInput = { mode: "amrap", durationSeconds: 720 };
const emom: WorkoutInput = { mode: "emom", intervalSeconds: 60, rounds: 3 };

describe("getTone", () => {
  it("is yellow during prep and red for its last 3 seconds", () => {
    expect(toneAt(forTime, 0)).toBe("prep");
    expect(toneAt(forTime, 6_999)).toBe("prep");
    expect(toneAt(forTime, 7_000)).toBe("alert");
  });

  it.each([
    ["For Time", forTime],
    ["AMRAP", amrap],
    ["EMOM", emom],
  ])("is green only in the first second of work (%s)", (_label, input) => {
    expect(toneAt(input, 10_000)).toBe("go");
    expect(toneAt(input, 10_999)).toBe("go");
    expect(toneAt(input, 11_000)).toBe("normal");
  });

  it("turns green again at the start of every EMOM interval", () => {
    expect(toneAt(emom, 70_000)).toBe("go");
    expect(toneAt(emom, 71_000)).toBe("normal");
  });

  it("is red in the last 3 seconds of an EMOM interval", () => {
    expect(toneAt(emom, 66_999)).toBe("normal");
    expect(toneAt(emom, 67_000)).toBe("alert");
  });

  it("is red in the last 3 seconds before the cap and when finished", () => {
    expect(toneAt(forTime, 607_000)).toBe("alert");
    expect(toneAt(forTime, 610_000)).toBe("alert");
  });

  it("is grey while paused", () => {
    expect(toneAt(amrap, 100_000, true)).toBe("dim");
  });
});
