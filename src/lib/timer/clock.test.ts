import { describe, expect, it } from "vitest";
import {
  getElapsedMs,
  isPaused,
  pauseRun,
  resumeRun,
  startRun,
  type RunState,
} from "./clock";
import { getDisplayState } from "./display";
import { workoutSchema } from "./schema";
import { buildTimeline } from "./timeline";

const T0 = Date.UTC(2026, 9, 26, 18, 0, 0);

describe("run clock", () => {
  it("derives elapsed time from the start timestamp", () => {
    const run = startRun(T0);
    expect(getElapsedMs(run, T0)).toBe(0);
    expect(getElapsedMs(run, T0 + 42_500)).toBe(42_500);
  });

  it("freezes while paused and excludes paused time after resuming", () => {
    let run = startRun(T0);
    run = pauseRun(run, T0 + 10_000);
    expect(isPaused(run)).toBe(true);
    expect(getElapsedMs(run, T0 + 25_000)).toBe(10_000);

    run = resumeRun(run, T0 + 30_000);
    expect(isPaused(run)).toBe(false);
    expect(getElapsedMs(run, T0 + 35_000)).toBe(15_000);
  });

  it("accumulates several pauses", () => {
    let run = startRun(T0);
    run = resumeRun(pauseRun(run, T0 + 1_000), T0 + 3_000);
    run = resumeRun(pauseRun(run, T0 + 5_000), T0 + 9_000);
    expect(run.pausedTotalMs).toBe(6_000);
    expect(getElapsedMs(run, T0 + 10_000)).toBe(4_000);
  });

  it("ignores a second pause and a resume while running", () => {
    const running = startRun(T0);
    expect(resumeRun(running, T0 + 1_000)).toBe(running);
    const paused = pauseRun(running, T0 + 2_000);
    expect(pauseRun(paused, T0 + 5_000)).toBe(paused);
  });

  it("never returns a negative elapsed time", () => {
    expect(getElapsedMs(startRun(T0), T0 - 60_000)).toBe(0);
    const weird = resumeRun(
      { startedAtMs: T0, pausedAtMs: T0 + 5_000, pausedTotalMs: 0 },
      T0,
    );
    expect(weird.pausedTotalMs).toBe(0);
  });
});

describe("resuming after a reload", () => {
  it("shows the same instant from a persisted run state", () => {
    const timeline = buildTimeline(
      workoutSchema.parse({ mode: "emom", intervalSeconds: 60, rounds: 10 }),
    );
    const persisted: RunState = JSON.parse(JSON.stringify(startRun(T0)));
    // The page was killed and reopened 4 min 25 s after the Start tap:
    // 10 s prep + 255 s of work = 15 s into round 5, so 45 s are left.
    const state = getDisplayState(
      timeline,
      getElapsedMs(persisted, T0 + 265_000),
    );
    expect(state).toMatchObject({ phase: "work", round: 5, clockSeconds: 45 });
  });
});
