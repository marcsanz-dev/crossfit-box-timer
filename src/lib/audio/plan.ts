import type { Cue } from "@/lib/timer/timeline";

export interface PlannedCue {
  cue: Cue;
  /** How far in the future the cue must sound, from `elapsedMs`. */
  delayMs: number;
}

export interface CuePlan {
  planned: PlannedCue[];
  /** Index of the first cue not handled yet; pass it to the next call. */
  nextIndex: number;
}

/**
 * Look-ahead scheduling: every tick hands the audio clock the cues that fall
 * within the next `lookaheadMs`, so beeps stay sample-accurate even if the main
 * thread stalls. Cues more than `lateToleranceMs` in the past are skipped
 * instead of being played late (for example after a reload or a long stall).
 */
export function planCues(
  cues: readonly Cue[],
  fromIndex: number,
  elapsedMs: number,
  lookaheadMs: number,
  lateToleranceMs: number,
): CuePlan {
  const planned: PlannedCue[] = [];
  let index = fromIndex;
  for (; index < cues.length; index++) {
    const cue = cues[index];
    if (!cue || cue.atMs >= elapsedMs + lookaheadMs) break;
    if (cue.atMs < elapsedMs - lateToleranceMs) continue;
    planned.push({ cue, delayMs: Math.max(0, cue.atMs - elapsedMs) });
  }
  return { planned, nextIndex: index };
}

/** First cue at or after `elapsedMs`; used when (re)starting the scheduler. */
export function firstCueIndexAt(
  cues: readonly Cue[],
  elapsedMs: number,
): number {
  const index = cues.findIndex((cue) => cue.atMs >= elapsedMs);
  return index === -1 ? cues.length : index;
}
