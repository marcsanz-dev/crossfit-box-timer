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
