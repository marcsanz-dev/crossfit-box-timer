import { getWorkSeconds, type Workout } from "./schema";

/**
 * Sound cues:
 * - `countdown`: short beep (3-2-1);
 * - `start`: long beep (go / new interval);
 * - `warning`: double beep (half time, 1 minute left);
 * - `finish`: final horn.
 */
export type CueKind = "countdown" | "start" | "warning" | "finish";

export interface Cue {
  /** Milliseconds since the Start tap. */
  atMs: number;
  kind: CueKind;
}

export interface Segment {
  kind: "prep" | "work";
  startMs: number;
  endMs: number;
  /** 1-based round for work segments (EMOM intervals); 0 for prep. */
  round: number;
}

/**
 * A workout expanded into absolute times. Time 0 is the Start tap.
 * Every mode is a list of segments, so new modes (Tabata, multi-part sessions)
 * only need a new way of building segments and warnings.
 */
export interface Timeline {
  workout: Workout;
  segments: readonly Segment[];
  cues: readonly Cue[];
  workStartMs: number;
  totalMs: number;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const COUNTDOWN_SECONDS = [3, 2, 1] as const;

export function buildTimeline(workout: Workout): Timeline {
  const workStartMs = workout.prepSeconds * SECOND;
  const workMs = getWorkSeconds(workout) * SECOND;
  const totalMs = workStartMs + workMs;

  const segments: Segment[] = [];
  if (workStartMs > 0) {
    segments.push({ kind: "prep", startMs: 0, endMs: workStartMs, round: 0 });
  }
  if (workout.mode === "emom") {
    const intervalMs = workout.intervalSeconds * SECOND;
    for (let round = 1; round <= workout.rounds; round++) {
      const startMs = workStartMs + (round - 1) * intervalMs;
      segments.push({
        kind: "work",
        startMs,
        endMs: startMs + intervalMs,
        round,
      });
    }
  } else {
    segments.push({
      kind: "work",
      startMs: workStartMs,
      endMs: totalMs,
      round: 1,
    });
  }

  const cues: Cue[] = [];
  for (const segment of segments) {
    if (segment.kind !== "work") continue;
    // The first interval only gets a 3-2-1 when there is a prep countdown.
    if (segment.startMs > 0) cues.push(...countdownBefore(segment.startMs));
    cues.push({ atMs: segment.startMs, kind: "start" });
  }
  cues.push(
    ...getWarningTimes(workout, workStartMs, totalMs)
      // Keep warnings strictly inside the work part and clear of the final 3-2-1.
      .filter((atMs) => atMs > workStartMs && atMs < totalMs - 3 * SECOND)
      .map((atMs): Cue => ({ atMs, kind: "warning" })),
  );
  cues.push(...countdownBefore(totalMs), { atMs: totalMs, kind: "finish" });

  return {
    workout,
    segments,
    cues: dedupeAndSort(cues),
    workStartMs,
    totalMs,
  };
}

function countdownBefore(atMs: number): Cue[] {
  return COUNTDOWN_SECONDS.map((seconds) => ({
    atMs: atMs - seconds * SECOND,
    kind: "countdown",
  }));
}

function getWarningTimes(
  workout: Workout,
  workStartMs: number,
  totalMs: number,
): number[] {
  switch (workout.mode) {
    case "forTime":
      return [totalMs - MINUTE];
    case "amrap":
      return [workStartMs + (totalMs - workStartMs) / 2, totalMs - MINUTE];
    case "emom":
      // The beep at the start of every interval already paces the athletes.
      return [];
  }
}

/** Sorted by time; when two cues coincide, the first one added wins. */
function dedupeAndSort(cues: Cue[]): Cue[] {
  const byTime = new Map<number, Cue>();
  for (const cue of cues) {
    if (!byTime.has(cue.atMs)) byTime.set(cue.atMs, cue);
  }
  return [...byTime.values()].sort((a, b) => a.atMs - b.atMs);
}

/** Cues with `fromMs <= atMs < toMs`, for the look-ahead audio scheduler. */
export function getCuesInWindow(
  timeline: Timeline,
  fromMs: number,
  toMs: number,
): Cue[] {
  return timeline.cues.filter((cue) => cue.atMs >= fromMs && cue.atMs < toMs);
}
