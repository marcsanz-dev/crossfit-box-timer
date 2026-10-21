import type { DisplayState } from "./display";
import type { Workout } from "./schema";

/**
 * Formats whole seconds as `m:ss`, or `mm:ss` with `padMinutes`.
 * Padding keeps the width stable for workouts of 10 minutes or more, so the
 * digits never jump on screen.
 */
export function formatClock(totalSeconds: number, padMinutes = false): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const mm = padMinutes ? String(minutes).padStart(2, "0") : String(minutes);
  return `${mm}:${String(rest).padStart(2, "0")}`;
}

/** "12" for whole minutes, "1:30" otherwise (AMRAP 12, AMRAP 1:30). */
export function formatMinutes(totalSeconds: number): string {
  return totalSeconds % 60 === 0
    ? String(totalSeconds / 60)
    : formatClock(totalSeconds);
}

/**
 * The text of the big clock. Bare seconds ("45") when they fit, because
 * fewer characters mean bigger digits: prep countdowns and EMOM intervals of
 * up to a minute.
 */
export function getClockText(workout: Workout, display: DisplayState): string {
  if (display.phase === "prep") return String(display.clockSeconds);
  if (workout.mode === "emom" && workout.intervalSeconds <= 60) {
    return String(display.clockSeconds);
  }
  const longestSeconds =
    workout.mode === "forTime"
      ? workout.capSeconds
      : workout.mode === "amrap"
        ? workout.durationSeconds
        : workout.intervalSeconds;
  return formatClock(display.clockSeconds, longestSeconds >= 600);
}
