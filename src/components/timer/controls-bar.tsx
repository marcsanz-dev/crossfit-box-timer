"use client";

import { useTranslations } from "next-intl";
import type { RunnerStatus } from "@/hooks/use-workout-runner";

interface ControlsBarProps {
  status: RunnerStatus;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onStop: () => void;
}

/** Hidden by default; one tap on the screen reveals it. Big targets for chalky hands. */
export function ControlsBar({
  status,
  onPause,
  onResume,
  onRestart,
  onStop,
}: ControlsBarProps) {
  const t = useTranslations("Timer");

  return (
    <div className="flex justify-center gap-3 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pt-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {status === "running" && (
        <button type="button" onClick={onPause} className={primaryClass}>
          {t("pause")}
        </button>
      )}
      {status === "paused" && (
        <button type="button" onClick={onResume} className={primaryClass}>
          {t("resume")}
        </button>
      )}
      <button type="button" onClick={onRestart} className={secondaryClass}>
        {t("restart")}
      </button>
      <button type="button" onClick={onStop} className={dangerClass}>
        {t("stop")}
      </button>
    </div>
  );
}

const baseClass =
  "min-h-16 flex-1 max-w-56 rounded-2xl px-4 text-xl font-bold transition active:scale-[0.98]";
const primaryClass = `${baseClass} bg-phone-fg text-black`;
const secondaryClass = `${baseClass} bg-phone-line text-phone-fg`;
const dangerClass = `${baseClass} bg-phone-alert text-black`;
