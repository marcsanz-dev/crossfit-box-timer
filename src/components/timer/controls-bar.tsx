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

/**
 * Hidden by default; one tap on the screen reveals it. Big targets for chalky
 * hands. Sizes follow the screen (cqmin), so the bar always fits completely.
 */
export function ControlsBar({
  status,
  onPause,
  onResume,
  onRestart,
  onStop,
}: ControlsBarProps) {
  const t = useTranslations("Timer");

  return (
    <div className="flex justify-center gap-[3cqmin] bg-gradient-to-t from-black via-black/90 to-transparent px-[4cqmin] pt-[8cqmin] pb-[3cqmin]">
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

// At least 3rem (48px) tall: a comfortable touch target even on small screens.
const baseClass =
  "min-h-[clamp(3rem,15cqmin,4.5rem)] min-w-0 flex-1 max-w-56 truncate rounded-2xl px-[2cqmin] text-[clamp(1rem,5.5cqmin,1.5rem)] font-bold transition active:scale-[0.98]";
const primaryClass = `${baseClass} bg-phone-fg text-black`;
const secondaryClass = `${baseClass} bg-phone-line text-phone-fg`;
const dangerClass = `${baseClass} bg-phone-alert text-black`;
