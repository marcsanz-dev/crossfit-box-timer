import { describe, expect, it } from "vitest";
import { workoutSchema, type WorkoutInput } from "./schema";
import { buildTimeline, getCuesInWindow, type Cue } from "./timeline";

const timelineOf = (input: WorkoutInput) =>
  buildTimeline(workoutSchema.parse(input));

/** Compact `"<seconds>:<kind>"` notation keeps the expectations readable. */
const cueList = (cues: readonly Cue[]) =>
  cues.map((cue) => `${cue.atMs / 1000}:${cue.kind}`);

describe("buildTimeline — For Time", () => {
  const timeline = timelineOf({ mode: "forTime", capSeconds: 600 });

  it("places work after a 10 s prep and ends at the cap", () => {
    expect(timeline.workStartMs).toBe(10_000);
    expect(timeline.totalMs).toBe(610_000);
    expect(timeline.segments).toEqual([
      { kind: "prep", startMs: 0, endMs: 10_000, round: 0 },
      { kind: "work", startMs: 10_000, endMs: 610_000, round: 1 },
    ]);
  });

  it("beeps 3-2-1-go, warns 1 minute before the cap and sounds the horn", () => {
    expect(cueList(timeline.cues)).toEqual([
      "7:countdown",
      "8:countdown",
      "9:countdown",
      "10:start",
      "550:warning",
      "607:countdown",
      "608:countdown",
      "609:countdown",
      "610:finish",
    ]);
  });

  it("skips the 1-minute warning when the cap is only 1 minute", () => {
    const short = timelineOf({ mode: "forTime", capSeconds: 60 });
    expect(short.cues.some((cue) => cue.kind === "warning")).toBe(false);
  });
});

describe("buildTimeline — AMRAP", () => {
  it("warns at half time and at 1 minute left", () => {
    const timeline = timelineOf({ mode: "amrap", durationSeconds: 720 });
    const warnings = timeline.cues.filter((cue) => cue.kind === "warning");
    expect(warnings.map((cue) => cue.atMs)).toEqual([370_000, 670_000]);
  });

  it("merges the warnings when half time is also 1 minute left", () => {
    const timeline = timelineOf({ mode: "amrap", durationSeconds: 120 });
    const warnings = timeline.cues.filter((cue) => cue.kind === "warning");
    expect(warnings.map((cue) => cue.atMs)).toEqual([70_000]);
  });

  it("keeps only the half-time warning in a 1-minute AMRAP", () => {
    const timeline = timelineOf({ mode: "amrap", durationSeconds: 60 });
    const warnings = timeline.cues.filter((cue) => cue.kind === "warning");
    expect(warnings.map((cue) => cue.atMs)).toEqual([40_000]);
  });
});

describe("buildTimeline — EMOM", () => {
  const timeline = timelineOf({
    mode: "emom",
    intervalSeconds: 60,
    rounds: 3,
    prepSeconds: 5,
  });

  it("creates one work segment per round", () => {
    expect(timeline.segments.filter((s) => s.kind === "work")).toEqual([
      { kind: "work", startMs: 5_000, endMs: 65_000, round: 1 },
      { kind: "work", startMs: 65_000, endMs: 125_000, round: 2 },
      { kind: "work", startMs: 125_000, endMs: 185_000, round: 3 },
    ]);
    expect(timeline.totalMs).toBe(185_000);
  });

  it("beeps 3-2-1 and a long beep before every interval, then the horn", () => {
    expect(cueList(timeline.cues)).toEqual([
      "2:countdown",
      "3:countdown",
      "4:countdown",
      "5:start",
      "62:countdown",
      "63:countdown",
      "64:countdown",
      "65:start",
      "122:countdown",
      "123:countdown",
      "124:countdown",
      "125:start",
      "182:countdown",
      "183:countdown",
      "184:countdown",
      "185:finish",
    ]);
  });

  it("supports intervals longer than a minute (E2MOM)", () => {
    const e2mom = timelineOf({ mode: "emom", intervalSeconds: 120, rounds: 5 });
    const starts = e2mom.cues.filter((cue) => cue.kind === "start");
    expect(starts.map((cue) => cue.atMs / 1000)).toEqual([
      10, 130, 250, 370, 490,
    ]);
  });
});

describe("buildTimeline — without prep", () => {
  const timeline = timelineOf({
    mode: "amrap",
    durationSeconds: 300,
    prepSeconds: 0,
  });

  it("has no prep segment and starts work at 0", () => {
    expect(timeline.workStartMs).toBe(0);
    expect(timeline.segments).toHaveLength(1);
  });

  it("plays the long beep on the Start tap without a 3-2-1", () => {
    expect(cueList(timeline.cues).slice(0, 2)).toEqual([
      "0:start",
      "150:warning",
    ]);
    expect(timeline.cues.every((cue) => cue.atMs >= 0)).toBe(true);
  });
});

describe("buildTimeline — invariants", () => {
  const samples: WorkoutInput[] = [
    { mode: "forTime", capSeconds: 3600, prepSeconds: 20 },
    { mode: "amrap", durationSeconds: 61 },
    { mode: "emom", intervalSeconds: 10, rounds: 60, prepSeconds: 0 },
    { mode: "emom", intervalSeconds: 600, rounds: 6 },
  ];

  it.each(samples)(
    "keeps cues sorted, unique and inside the workout for %o",
    (input) => {
      const { cues, totalMs } = timelineOf(input);
      const times = cues.map((cue) => cue.atMs);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(new Set(times).size).toBe(times.length);
      expect(times.every((t) => t >= 0 && t <= totalMs)).toBe(true);
      expect(cues.at(-1)).toEqual({ atMs: totalMs, kind: "finish" });
    },
  );

  it.each(samples)(
    "covers the whole workout with contiguous segments for %o",
    (input) => {
      const { segments, totalMs } = timelineOf(input);
      expect(segments[0]?.startMs).toBe(0);
      expect(segments.at(-1)?.endMs).toBe(totalMs);
      for (let i = 1; i < segments.length; i++) {
        expect(segments[i]?.startMs).toBe(segments[i - 1]?.endMs);
      }
    },
  );
});

describe("getCuesInWindow", () => {
  const timeline = timelineOf({ mode: "forTime", capSeconds: 600 });

  it("includes the start of the window and excludes the end", () => {
    expect(cueList(getCuesInWindow(timeline, 8_000, 10_000))).toEqual([
      "8:countdown",
      "9:countdown",
    ]);
    expect(cueList(getCuesInWindow(timeline, 10_000, 10_001))).toEqual([
      "10:start",
    ]);
  });

  it("returns nothing for an empty window", () => {
    expect(getCuesInWindow(timeline, 20_000, 20_000)).toEqual([]);
  });
});
