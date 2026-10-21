import { describe, expect, it } from "vitest";
import type { Cue } from "@/lib/timer/timeline";
import { firstCueIndexAt, planCues } from "./plan";

const cues: Cue[] = [
  { atMs: 7_000, kind: "countdown" },
  { atMs: 8_000, kind: "countdown" },
  { atMs: 9_000, kind: "countdown" },
  { atMs: 10_000, kind: "start" },
  { atMs: 70_000, kind: "finish" },
];

describe("planCues", () => {
  it("returns only cues inside the look-ahead window, with their delay", () => {
    const plan = planCues(cues, 0, 6_500, 2_000, 250);
    expect(plan.planned).toEqual([
      { cue: cues[0], delayMs: 500 },
      { cue: cues[1], delayMs: 1_500 },
    ]);
    expect(plan.nextIndex).toBe(2);
  });

  it("continues from the previous index without repeating cues", () => {
    const first = planCues(cues, 0, 6_500, 2_000, 250);
    // The window end is exclusive: at 7 s + 2 s the 9 s cue is not due yet.
    expect(planCues(cues, first.nextIndex, 7_000, 2_000, 250).planned).toEqual(
      [],
    );
    const second = planCues(cues, first.nextIndex, 7_500, 2_000, 250);
    expect(second.planned.map((p) => p.cue.atMs)).toEqual([9_000]);
    expect(second.nextIndex).toBe(3);
  });

  it("plays a slightly late cue immediately", () => {
    const plan = planCues(cues, 3, 10_100, 1_000, 250);
    expect(plan.planned).toEqual([{ cue: cues[3], delayMs: 0 }]);
  });

  it("skips cues that are too late instead of playing them", () => {
    const plan = planCues(cues, 0, 9_800, 1_000, 250);
    expect(plan.planned.map((p) => p.cue.atMs)).toEqual([10_000]);
    expect(plan.nextIndex).toBe(4);
  });

  it("returns nothing once every cue is handled", () => {
    expect(planCues(cues, cues.length, 80_000, 1_000, 250)).toEqual({
      planned: [],
      nextIndex: cues.length,
    });
  });
});

describe("firstCueIndexAt", () => {
  it("finds the first cue at or after the elapsed time", () => {
    expect(firstCueIndexAt(cues, 0)).toBe(0);
    expect(firstCueIndexAt(cues, 8_000)).toBe(1);
    expect(firstCueIndexAt(cues, 8_001)).toBe(2);
  });

  it("returns the length when no cue is left", () => {
    expect(firstCueIndexAt(cues, 70_001)).toBe(cues.length);
  });
});
