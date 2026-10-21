import { z } from "zod";
import { getElapsedMs, type RunState } from "./clock";
import { workoutSchema, type Workout } from "./schema";
import type { Timeline } from "./timeline";

/** A finished or abandoned run is forgotten this long after the workout ends. */
export const SESSION_STALE_AFTER_MS = 30 * 60 * 1000;

const runStateSchema = z.object({
  startedAtMs: z.number().finite(),
  pausedAtMs: z.number().finite().nullable(),
  pausedTotalMs: z.number().finite().min(0),
});

const storedSessionSchema = z.object({
  version: z.literal(1),
  /** Identifies the workout source (a demo slug or a share code). */
  key: z.string().min(1),
  workout: workoutSchema,
  run: runStateSchema,
});

export type StoredSession = z.output<typeof storedSessionSchema>;

export function serializeSession(
  key: string,
  workout: Workout,
  run: RunState,
): string {
  return JSON.stringify({ version: 1, key, workout, run });
}

/**
 * Parses what localStorage returned. Anything invalid, from another key or
 * from an older format yields `null`, so the phone simply starts fresh.
 */
export function parseSession(
  raw: string | null,
  key: string,
): StoredSession | null {
  if (!raw) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = storedSessionSchema.safeParse(json);
  return result.success && result.data.key === key ? result.data : null;
}

export function isSessionStale(
  run: RunState,
  timeline: Timeline,
  nowMs: number,
): boolean {
  return getElapsedMs(run, nowMs) > timeline.totalMs + SESSION_STALE_AFTER_MS;
}
