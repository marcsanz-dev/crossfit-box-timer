import type { Segment, Timeline } from "./timeline";

export type DisplayPhase = "prep" | "work" | "finished";

/** Everything the phone screen needs at one instant, already rounded to whole seconds. */
export interface DisplayState {
  phase: DisplayPhase;
  /**
   * The big number, in seconds:
   * - prep: seconds left;
   * - For Time: elapsed, counting up;
   * - AMRAP: time left in the workout;
   * - EMOM: time left in the current interval.
   */
  clockSeconds: number;
  clockDirection: "up" | "down";
  /** Seconds left in the current segment: prep, the work part, or the EMOM interval. */
  segmentRemainingSeconds: number;
  /** Seconds left until the end of the workout (For Time: time to the cap). */
  workoutRemainingSeconds: number;
  /** 1-based EMOM round; 1 for single-block modes; 0 during prep. */
  round: number;
  totalRounds: number;
  /** EMOM stations for the current and the next interval, if configured. */
  station?: { current: string; next?: string };
  /** Fraction of the work part completed, from 0 to 1. */
  progress: number;
}

export function getDisplayState(
  timeline: Timeline,
  elapsedMs: number,
): DisplayState {
  const { workout, workStartMs, totalMs } = timeline;
  const t = Math.min(Math.max(elapsedMs, 0), totalMs);
  const workMs = totalMs - workStartMs;
  const totalRounds = workout.mode === "emom" ? workout.rounds : 1;
  const workoutRemainingSeconds = ceilSeconds(totalMs - t);
  // The schema guarantees at least 1 minute of work, so workMs is never 0.
  const progress = Math.max(0, t - workStartMs) / workMs;

  if (elapsedMs >= totalMs) {
    return {
      phase: "finished",
      clockSeconds: workout.mode === "forTime" ? workMs / 1000 : 0,
      clockDirection: workout.mode === "forTime" ? "up" : "down",
      segmentRemainingSeconds: 0,
      workoutRemainingSeconds: 0,
      round: totalRounds,
      totalRounds,
      progress: 1,
    };
  }

  const segment = findSegment(timeline.segments, t);
  const segmentRemainingSeconds = ceilSeconds(segment.endMs - t);

  if (segment.kind === "prep") {
    return {
      phase: "prep",
      clockSeconds: segmentRemainingSeconds,
      clockDirection: "down",
      segmentRemainingSeconds,
      workoutRemainingSeconds,
      round: 0,
      totalRounds,
      progress: 0,
    };
  }

  const base = {
    phase: "work",
    segmentRemainingSeconds,
    workoutRemainingSeconds,
    round: segment.round,
    totalRounds,
    progress,
  } as const;

  switch (workout.mode) {
    case "forTime":
      return {
        ...base,
        clockSeconds: Math.floor((t - workStartMs) / 1000),
        clockDirection: "up",
      };
    case "amrap":
      return {
        ...base,
        clockSeconds: workoutRemainingSeconds,
        clockDirection: "down",
      };
    case "emom":
      return {
        ...base,
        clockSeconds: segmentRemainingSeconds,
        clockDirection: "down",
        station: getStation(workout.stations, segment.round, totalRounds),
      };
  }
}

/** The segment containing `t` (start inclusive, end exclusive). */
function findSegment(segments: readonly Segment[], t: number): Segment {
  const segment = segments.find((s) => t >= s.startMs && t < s.endMs);
  if (!segment) throw new RangeError(`No segment at ${t} ms`);
  return segment;
}

/**
 * Countdowns round up, so "1" stays on screen until the very end.
 * The small epsilon absorbs floating-point noise from fractional milliseconds.
 */
function ceilSeconds(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000 - 1e-9));
}

function getStation(
  stations: readonly string[],
  round: number,
  totalRounds: number,
): DisplayState["station"] {
  if (stations.length === 0) return undefined;
  const at = (r: number) => stations[(r - 1) % stations.length] ?? "";
  return {
    current: at(round),
    next: round < totalRounds ? at(round + 1) : undefined,
  };
}
