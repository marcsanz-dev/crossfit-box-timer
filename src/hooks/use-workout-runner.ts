"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CuePlayer } from "@/browser/cue-player";
import { enterFullscreen } from "@/browser/platform";
import { ScreenWakeLock, type WakeLockStatus } from "@/browser/wake-lock";
import { firstCueIndexAt, planCues } from "@/lib/audio/plan";
import {
  getElapsedMs,
  isPaused,
  pauseRun,
  resumeRun,
  startRun,
  type RunState,
} from "@/lib/timer/clock";
import { getDisplayState, type DisplayState } from "@/lib/timer/display";
import type { Workout } from "@/lib/timer/schema";
import {
  isSessionStale,
  parseSession,
  serializeSession,
} from "@/lib/timer/session";
import { buildTimeline } from "@/lib/timer/timeline";

export type RunnerStatus = "ready" | "running" | "paused" | "finished";

const STORAGE_KEY = "crossfit-box.timer.session";
const SCHEDULER_INTERVAL_MS = 200;
const LOOKAHEAD_MS = 1500;
const LATE_TOLERANCE_MS = 300;

/**
 * Drives one workout on the phone.
 * - It derives the screen state from the persisted run timestamps.
 * - It feeds cues to the audio clock ahead of time.
 * - It keeps the screen awake, and recovers after reloads and audio interruptions.
 */
export function useWorkoutRunner(workout: Workout, sessionKey: string) {
  const timeline = useMemo(() => buildTimeline(workout), [workout]);
  const [run, setRun] = useState<RunState | null>(null);
  const [display, setDisplay] = useState<DisplayState>(() =>
    getDisplayState(timeline, 0),
  );
  const [needsSoundTap, setNeedsSoundTap] = useState(false);
  const [wakeLockStatus, setWakeLockStatus] = useState<WakeLockStatus>("idle");

  const playerRef = useRef<CuePlayer | null>(null);
  const wakeLockRef = useRef<ScreenWakeLock | null>(null);
  const nextCueRef = useRef(0);

  // Create browser-only helpers once, and tear them down on unmount.
  useEffect(() => {
    const player = new CuePlayer();
    const wakeLock = new ScreenWakeLock();
    playerRef.current = player;
    wakeLockRef.current = wakeLock;
    const unsubscribeWake = wakeLock.subscribe(() =>
      setWakeLockStatus(wakeLock.status),
    );
    return () => {
      unsubscribeWake();
      void wakeLock.release();
      player.dispose();
    };
  }, []);

  const persist = useCallback(
    (next: RunState | null) => {
      try {
        if (next) {
          localStorage.setItem(
            STORAGE_KEY,
            serializeSession(sessionKey, workout, next),
          );
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // Private mode or storage disabled: the timer still works, without resume.
      }
    },
    [sessionKey, workout],
  );

  // Resume a run that was in progress before a reload. Audio needs a new tap.
  useEffect(() => {
    let stored = null;
    try {
      stored = parseSession(localStorage.getItem(STORAGE_KEY), sessionKey);
    } catch {
      return;
    }
    if (!stored || isSessionStale(stored.run, timeline, Date.now())) return;
    const restored = stored.run;
    nextCueRef.current = firstCueIndexAt(
      timeline.cues,
      getElapsedMs(restored, Date.now()),
    );
    // Restoring external state (localStorage) after hydration is exactly what effects are for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRun(restored);
    setNeedsSoundTap(true);
    void wakeLockRef.current?.acquire();
  }, [sessionKey, timeline]);

  const running = run !== null && !isPaused(run);

  // Repaint loop: only re-render when something visible changes.
  useEffect(() => {
    if (!run) return;
    let frame = 0;
    let lastKey = "";
    const tick = () => {
      const next = getDisplayState(timeline, getElapsedMs(run, Date.now()));
      const key = `${next.phase}|${next.clockSeconds}|${next.round}|${next.segmentRemainingSeconds}|${next.workoutRemainingSeconds}`;
      if (key !== lastKey) {
        lastKey = key;
        setDisplay(next);
      }
      if (next.phase !== "finished" && !isPaused(run)) {
        frame = requestAnimationFrame(tick);
      }
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [run, timeline]);

  // Audio scheduler: hands upcoming cues to the audio clock ahead of time.
  useEffect(() => {
    if (!run || !running) return;
    const schedule = () => {
      const player = playerRef.current;
      if (!player) return;
      const plan = planCues(
        timeline.cues,
        nextCueRef.current,
        getElapsedMs(run, Date.now()),
        LOOKAHEAD_MS,
        LATE_TOLERANCE_MS,
      );
      nextCueRef.current = plan.nextIndex;
      for (const { cue, delayMs } of plan.planned)
        player.play(cue.kind, delayMs);
    };
    schedule();
    const id = window.setInterval(schedule, SCHEDULER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [run, running, timeline]);

  // Recover audio after interruptions (calls, other apps, screen lock).
  useEffect(() => {
    if (!running) return;
    const player = playerRef.current;
    if (!player) return;
    const recover = () => {
      if (player.state === "running" || player.state === "uninitialized")
        return;
      void player.resume().then((ok) => {
        if (!ok) setNeedsSoundTap(true);
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") recover();
    };
    const unsubscribe = player.subscribe(recover);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [running]);

  /**
   * Everything a user gesture must unlock: sound, wake lock, fullscreen.
   * Each step is best-effort: a device that refuses one of them must still
   * run the clock. Resolves whether sound is on.
   */
  const unlockDevice = useCallback(async (): Promise<boolean> => {
    const sound = playerRef.current?.unlock() ?? Promise.resolve(false);
    void wakeLockRef.current?.acquire().catch(() => undefined);
    try {
      enterFullscreen();
    } catch {
      // Not available on this device.
    }
    return sound.catch(() => false);
  }, []);

  const begin = useCallback(() => {
    playerRef.current?.cancelAll();
    const next = startRun(Date.now());
    nextCueRef.current = 0;
    setNeedsSoundTap(false);
    setRun(next);
    persist(next);
    void unlockDevice().then((ok) => {
      if (!ok) setNeedsSoundTap(true);
    });
  }, [persist, unlockDevice]);

  const pause = useCallback(() => {
    if (!run || isPaused(run)) return;
    playerRef.current?.cancelAll();
    const next = pauseRun(run, Date.now());
    setRun(next);
    persist(next);
  }, [persist, run]);

  const resume = useCallback(() => {
    if (!run || !isPaused(run)) return;
    void unlockDevice();
    const next = resumeRun(run, Date.now());
    nextCueRef.current = firstCueIndexAt(
      timeline.cues,
      getElapsedMs(next, Date.now()),
    );
    setRun(next);
    persist(next);
  }, [persist, run, timeline, unlockDevice]);

  const stop = useCallback(() => {
    playerRef.current?.cancelAll();
    void wakeLockRef.current?.release();
    setRun(null);
    setDisplay(getDisplayState(timeline, 0));
    setNeedsSoundTap(false);
    persist(null);
  }, [persist, timeline]);

  const reactivateSound = useCallback(() => {
    void unlockDevice().then((ok) => setNeedsSoundTap(!ok));
  }, [unlockDevice]);

  const status: RunnerStatus = !run
    ? "ready"
    : display.phase === "finished"
      ? "finished"
      : isPaused(run)
        ? "paused"
        : "running";

  return {
    timeline,
    display,
    status,
    needsSoundTap,
    wakeLockStatus,
    start: begin,
    restart: begin,
    pause,
    resume,
    stop,
    reactivateSound,
  };
}
