import { describe, expect, it } from "vitest";
import { getDisplayState } from "./display";
import { workoutSchema, type WorkoutInput } from "./schema";
import { buildTimeline } from "./timeline";

const at = (input: WorkoutInput, elapsedMs: number) =>
  getDisplayState(buildTimeline(workoutSchema.parse(input)), elapsedMs);

const S = 1000;

describe("getDisplayState — prep countdown", () => {
  const forTime: WorkoutInput = { mode: "forTime", capSeconds: 600 };

  it("counts down from the prep length, rounding up", () => {
    expect(at(forTime, 0)).toMatchObject({
      phase: "prep",
      clockSeconds: 10,
      round: 0,
    });
    expect(at(forTime, 0.5 * S).clockSeconds).toBe(10);
    expect(at(forTime, 1 * S).clockSeconds).toBe(9);
    expect(at(forTime, 9.999 * S).clockSeconds).toBe(1);
  });

  it("shows 3 exactly when the first countdown beep plays", () => {
    expect(at(forTime, 7 * S).clockSeconds).toBe(3);
  });

  it("switches to work exactly at the end of prep", () => {
    expect(at(forTime, 10 * S)).toMatchObject({
      phase: "work",
      clockSeconds: 0,
    });
  });

  it("treats a negative elapsed time as the Start tap", () => {
    expect(at(forTime, -5 * S)).toMatchObject({
      phase: "prep",
      clockSeconds: 10,
    });
  });
});

describe("getDisplayState — For Time", () => {
  const forTime: WorkoutInput = { mode: "forTime", capSeconds: 600 };

  it("counts elapsed time up, rounding down", () => {
    expect(at(forTime, 10 * S + 999)).toMatchObject({
      clockSeconds: 0,
      clockDirection: "up",
    });
    expect(at(forTime, (10 + 462) * S).clockSeconds).toBe(462);
  });

  it("reports the time left to the cap", () => {
    expect(at(forTime, (10 + 540) * S).workoutRemainingSeconds).toBe(60);
  });

  it("freezes on the cap when finished", () => {
    expect(at(forTime, 610 * S)).toEqual({
      phase: "finished",
      clockSeconds: 600,
      clockDirection: "up",
      segmentRemainingSeconds: 0,
      workoutRemainingSeconds: 0,
      round: 1,
      totalRounds: 1,
      progress: 1,
    });
    expect(at(forTime, 9_999 * S).phase).toBe("finished");
  });
});

describe("getDisplayState — AMRAP", () => {
  const amrap: WorkoutInput = { mode: "amrap", durationSeconds: 720 };

  it("counts the workout down from its full length", () => {
    expect(at(amrap, 10 * S)).toMatchObject({
      phase: "work",
      clockSeconds: 720,
      clockDirection: "down",
      progress: 0,
    });
    expect(at(amrap, (10 + 0.001) * S).clockSeconds).toBe(720);
    expect(at(amrap, (10 + 1) * S).clockSeconds).toBe(719);
  });

  it("shows 1 until the very end, then 0 when finished", () => {
    expect(at(amrap, 730 * S - 1).clockSeconds).toBe(1);
    expect(at(amrap, 730 * S)).toMatchObject({
      phase: "finished",
      clockSeconds: 0,
    });
  });

  it("reports progress through the work part", () => {
    expect(at(amrap, (10 + 360) * S).progress).toBe(0.5);
  });
});

describe("getDisplayState — EMOM", () => {
  const emom: WorkoutInput = {
    mode: "emom",
    intervalSeconds: 60,
    rounds: 5,
    stations: ["Burpees", "Squats"],
  };

  it("shows the seconds left in the interval and the round", () => {
    expect(at(emom, 10 * S)).toMatchObject({
      phase: "work",
      clockSeconds: 60,
      round: 1,
      totalRounds: 5,
    });
    expect(at(emom, (10 + 35) * S).clockSeconds).toBe(25);
  });

  it("moves to the next round exactly on the interval boundary", () => {
    expect(at(emom, (10 + 60) * S - 1)).toMatchObject({
      round: 1,
      clockSeconds: 1,
    });
    expect(at(emom, (10 + 60) * S)).toMatchObject({
      round: 2,
      clockSeconds: 60,
    });
  });

  it("cycles the stations and shows the next one", () => {
    expect(at(emom, 10 * S).station).toEqual({
      current: "Burpees",
      next: "Squats",
    });
    expect(at(emom, 70 * S).station).toEqual({
      current: "Squats",
      next: "Burpees",
    });
    expect(at(emom, 130 * S).station).toEqual({
      current: "Burpees",
      next: "Squats",
    });
  });

  it("has no next station in the last round", () => {
    expect(at(emom, (10 + 4 * 60) * S)).toMatchObject({
      round: 5,
      station: { current: "Burpees", next: undefined },
    });
  });

  it("omits stations when none are configured", () => {
    const plain = at({ mode: "emom", intervalSeconds: 60, rounds: 3 }, 20 * S);
    expect(plain.station).toBeUndefined();
  });

  it("reports the time left in the whole workout", () => {
    expect(at(emom, (10 + 90) * S).workoutRemainingSeconds).toBe(210);
  });

  it("ends on the last round with the clock at 0", () => {
    expect(at(emom, 310 * S)).toMatchObject({
      phase: "finished",
      clockSeconds: 0,
      clockDirection: "down",
      round: 5,
    });
  });
});

describe("getDisplayState — without prep", () => {
  it("starts working at 0", () => {
    const state = at(
      { mode: "amrap", durationSeconds: 300, prepSeconds: 0 },
      0,
    );
    expect(state).toMatchObject({ phase: "work", clockSeconds: 300, round: 1 });
  });
});
