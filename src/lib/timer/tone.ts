import type { DisplayState } from "./display";
import type { Workout } from "./schema";

export type Tone = "normal" | "prep" | "go" | "alert" | "dim";

/** Seconds at the end of a segment that are shown in red (the 3-2-1). */
const ALERT_SECONDS = 3;

/**
 * Colour carries meaning at a distance:
 * - yellow: get ready;
 * - green: the first second of work ("go");
 * - red: the last 3 seconds of a segment, and the end;
 * - grey: paused.
 */
export function getTone(
  workout: Workout,
  display: DisplayState,
  paused: boolean,
): Tone {
  if (paused) return "dim";
  if (display.phase === "finished") return "alert";
  if (display.segmentRemainingSeconds <= ALERT_SECONDS) return "alert";
  if (display.phase === "prep") return "prep";
  return isFirstSecondOfWork(workout, display) ? "go" : "normal";
}

function isFirstSecondOfWork(workout: Workout, display: DisplayState): boolean {
  switch (workout.mode) {
    case "forTime":
      return display.clockSeconds === 0;
    case "amrap":
      return display.segmentRemainingSeconds === workout.durationSeconds;
    case "emom":
      return display.segmentRemainingSeconds === workout.intervalSeconds;
  }
}
