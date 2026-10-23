"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useWorkoutRunner } from "@/hooks/use-workout-runner";
import type { Workout } from "@/lib/timer/schema";
import { ConfirmDialog } from "./confirm-dialog";
import { ControlsBar } from "./controls-bar";
import { PhoneFrame } from "./phone-frame";
import { ReadyScreen } from "./ready-screen";
import { RunningView } from "./running-view";
import { TransientAlert } from "./transient-alert";

interface TimerScreenProps {
  workout: Workout;
  /** Identifies the workout source, so a reload resumes the right run. */
  sessionKey: string;
  exitHref: string;
}

const CONTROLS_AUTO_HIDE_MS = 5000;

export function TimerScreen({
  workout,
  sessionKey,
  exitHref,
}: TimerScreenProps) {
  const t = useTranslations("Timer");
  const runner = useWorkoutRunner(workout, sessionKey);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [confirm, setConfirm] = useState<"stop" | "restart" | null>(null);
  const { status } = runner;

  // Controls hide themselves while running, so the clock stays clean.
  useEffect(() => {
    if (!controlsOpen || status !== "running" || confirm) return;
    const id = window.setTimeout(
      () => setControlsOpen(false),
      CONTROLS_AUTO_HIDE_MS,
    );
    return () => window.clearTimeout(id);
  }, [controlsOpen, status, confirm]);

  if (status === "ready") {
    return (
      <PhoneFrame>
        <ReadyScreen
          workout={workout}
          exitHref={exitHref}
          onStart={runner.start}
        />
      </PhoneFrame>
    );
  }

  const showControls =
    controlsOpen || status === "paused" || status === "finished";

  return (
    <PhoneFrame>
      <main className="relative h-full select-none">
        <RunningView
          workout={workout}
          display={runner.display}
          status={status}
        />

        {/*
        The whole screen is one big toggle: one tap shows the controls, the next
        hides them at once. While paused or finished they always stay visible.
      */}
        <button
          type="button"
          aria-label={t(showControls ? "hideControls" : "showControls")}
          aria-expanded={showControls}
          onClick={() => setControlsOpen((open) => !open)}
          className="absolute inset-0 z-10 cursor-default"
        />

        {runner.wakeLockStatus === "failed" && (
          <TransientAlert>{t("wakeLockFailed")}</TransientAlert>
        )}

        {/* Stacked, never overlapping: the sound prompt must not hide the controls. */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col">
          {runner.needsSoundTap && (
            <button
              type="button"
              onClick={runner.reactivateSound}
              className="mx-[3cqmin] mb-[3cqmin] flex flex-col items-center gap-1 rounded-3xl bg-phone-prep px-5 py-[3cqmin] text-black shadow-2xl"
            >
              <span className="text-[clamp(1.1rem,6cqmin,1.75rem)] leading-tight font-black">
                {t("tapForSound")}
              </span>
              <span className="text-[clamp(0.85rem,3.8cqmin,1.1rem)] leading-snug">
                {t("tapForSoundHint")}
              </span>
            </button>
          )}
          {showControls && (
            <ControlsBar
              status={status}
              onPause={runner.pause}
              onResume={runner.resume}
              onRestart={() => setConfirm("restart")}
              onStop={() => setConfirm("stop")}
            />
          )}
        </div>

        <ConfirmDialog
          open={confirm !== null}
          title={t(
            confirm === "restart" ? "confirmRestartTitle" : "confirmStopTitle",
          )}
          body={t(
            confirm === "restart" ? "confirmRestartBody" : "confirmStopBody",
          )}
          confirmLabel={t(confirm === "restart" ? "restart" : "stop")}
          cancelLabel={t("cancel")}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm === "restart") runner.restart();
            else runner.stop();
            setConfirm(null);
            setControlsOpen(false);
          }}
        />
      </main>
    </PhoneFrame>
  );
}
