/**
 * Run state persisted on the phone (localStorage), so a reload or a killed tab
 * resumes at the right second.
 * - Times are epoch milliseconds (`Date.now()`), because they must survive a page reload.
 * - Elapsed time is always derived from them, never counted tick by tick, so a slow
 *   or throttled main thread can delay a repaint but never makes the clock drift.
 */
export interface RunState {
  startedAtMs: number;
  /** Set while paused. */
  pausedAtMs: number | null;
  /** Total time spent paused before the current pause. */
  pausedTotalMs: number;
}

export function startRun(nowMs: number): RunState {
  return { startedAtMs: nowMs, pausedAtMs: null, pausedTotalMs: 0 };
}

export function pauseRun(state: RunState, nowMs: number): RunState {
  if (state.pausedAtMs !== null) return state;
  return { ...state, pausedAtMs: nowMs };
}

export function resumeRun(state: RunState, nowMs: number): RunState {
  if (state.pausedAtMs === null) return state;
  return {
    ...state,
    pausedAtMs: null,
    pausedTotalMs: state.pausedTotalMs + Math.max(0, nowMs - state.pausedAtMs),
  };
}

export function isPaused(state: RunState): boolean {
  return state.pausedAtMs !== null;
}

/** Never negative, even if the device clock is moved backwards. */
export function getElapsedMs(state: RunState, nowMs: number): number {
  const effectiveNow = state.pausedAtMs ?? nowMs;
  return Math.max(0, effectiveNow - state.startedAtMs - state.pausedTotalMs);
}
