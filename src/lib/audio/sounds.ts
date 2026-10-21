import type { CueKind } from "@/lib/timer/timeline";

export interface Tone {
  offsetMs: number;
  durationMs: number;
  /** Several frequencies play together as a chord. */
  frequencies: readonly number[];
  type: OscillatorType;
}

/**
 * Synthesized cues, so there are no audio files to load.
 * - Square and sawtooth waves are rich in harmonics, which helps them cut
 *   through music and gym noise.
 * - Most energy sits around 1–3 kHz, where hearing is most sensitive.
 * - Each cue has a different length and rhythm, so they can be told apart
 *   without looking.
 */
export const SOUNDS: Record<CueKind, readonly Tone[]> = {
  // Short "pip" for 3-2-1 (C6).
  countdown: [
    { offsetMs: 0, durationMs: 160, frequencies: [1046.5], type: "square" },
  ],
  // Long, higher beep for "go" and every new interval (G6).
  start: [
    { offsetMs: 0, durationMs: 750, frequencies: [1568], type: "square" },
  ],
  // Double beep for warnings (E6).
  warning: [
    { offsetMs: 0, durationMs: 130, frequencies: [1318.5], type: "square" },
    { offsetMs: 220, durationMs: 130, frequencies: [1318.5], type: "square" },
  ],
  // Final horn: a long, low major chord (C5-E5-G5).
  finish: [
    {
      offsetMs: 0,
      durationMs: 1800,
      frequencies: [523.25, 659.25, 783.99],
      type: "sawtooth",
    },
  ],
};
