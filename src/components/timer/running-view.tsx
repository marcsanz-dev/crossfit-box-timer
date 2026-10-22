"use client";

import { useTranslations } from "next-intl";
import type { RunnerStatus } from "@/hooks/use-workout-runner";
import type { DisplayState } from "@/lib/timer/display";
import { formatClock, getClockText } from "@/lib/timer/format";
import type { Workout } from "@/lib/timer/schema";
import { getTone, type Tone } from "@/lib/timer/tone";
import { useModeLabel } from "./use-mode-label";

interface RunningViewProps {
  workout: Workout;
  display: DisplayState;
  status: RunnerStatus;
}

/**
 * Geist's tabular digits are 0.636em wide (measured), and the colon is narrower.
 * Sizing every character as a digit keeps the clock inside the width. Geist is
 * used instead of Geist Mono because its zero is not slashed, which reads
 * better from a distance.
 */
const CHAR_WIDTH_EM = 0.64;

/**
 * The full-screen timer. Sizes use container query units (cqw/cqh/cqmin), so
 * the same layout fills any phone in portrait or landscape.
 */
export function RunningView({ workout, display, status }: RunningViewProps) {
  const t = useTranslations("Timer");
  const modeLabel = useModeLabel(workout);
  const finished = display.phase === "finished";

  const clockText =
    finished && workout.mode !== "forTime"
      ? t("finished")
      : getClockText(workout, display);
  const clockSize = `min(${(94 / (CHAR_WIDTH_EM * clockText.length)).toFixed(1)}cqw, 96cqh)`;
  const tone = getTone(workout, display, status === "paused");

  const statusLabel =
    status === "paused"
      ? t("paused")
      : display.phase === "prep"
        ? t("prepare")
        : finished && workout.mode === "forTime"
          ? t("timeCap")
          : null;

  return (
    <div className="[container-type:size] flex h-full flex-col px-[4cqmin] pt-[3cqmin] pb-[2cqmin]">
      <header className="flex items-baseline justify-between gap-[3cqmin] text-[clamp(0.9rem,4.6cqmin,3rem)] leading-tight">
        <p className="font-bold tracking-wide">{modeLabel}</p>
        {workout.name && (
          <p className="truncate text-phone-dim">{workout.name}</p>
        )}
      </header>

      {statusLabel && (
        <p
          className={`mt-[2cqmin] text-center text-[clamp(1rem,7cqmin,5rem)] leading-none font-black tracking-widest uppercase ${toneClass[tone]}`}
        >
          {statusLabel}
        </p>
      )}

      <div className="[container-type:size] flex min-h-0 flex-1 items-center justify-center">
        <p
          role="timer"
          className={`leading-none font-extrabold tracking-tight tabular-nums ${toneClass[tone]}`}
          style={{ fontSize: clockSize }}
        >
          {clockText}
        </p>
      </div>

      <footer className="flex flex-col items-center gap-[1cqmin] text-center">
        <Details workout={workout} display={display} />
        <div className="mt-[1cqmin] h-[1.2cqmin] w-full overflow-hidden rounded-full bg-phone-line">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${barClass[tone]}`}
            style={{ width: `${(display.progress * 100).toFixed(2)}%` }}
          />
        </div>
      </footer>
    </div>
  );
}

function Details({ workout, display }: Omit<RunningViewProps, "status">) {
  const t = useTranslations("Timer");

  if (workout.mode === "emom" && display.phase !== "prep") {
    return (
      <>
        <p className="text-[clamp(1.25rem,9cqmin,6rem)] leading-none font-bold tabular-nums">
          {t("round", { current: display.round, total: display.totalRounds })}
        </p>
        {display.station && display.phase === "work" && (
          <p className="max-w-full truncate text-[clamp(1rem,6cqmin,4rem)] leading-tight">
            <span className="text-phone-dim">{t("now")}: </span>
            <span className="font-semibold">{display.station.current}</span>
            {display.station.next && (
              <span className="text-phone-dim">
                {" · "}
                {t("next")}: {display.station.next}
              </span>
            )}
          </p>
        )}
      </>
    );
  }

  return (
    <>
      {workout.mode === "forTime" && display.phase === "work" && (
        <p className="text-[clamp(1rem,6cqmin,4rem)] leading-tight font-semibold tabular-nums">
          {t("capIn", { time: formatClock(display.workoutRemainingSeconds) })}
        </p>
      )}
      {workout.description && <Description text={workout.description} />}
    </>
  );
}

/**
 * Exercises, one per line in portrait. In landscape the width is plentiful but
 * height is scarce, so the lines are joined with " · " on a single row.
 * Only an unusually long description is clamped, so it never shrinks the clock.
 */
function Description({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <p className="text-[clamp(0.9rem,4.4cqmin,2.5rem)] leading-snug text-phone-dim">
      <span className="line-clamp-6 whitespace-pre-line landscape:hidden">
        {lines.join("\n")}
      </span>
      <span className="line-clamp-2 portrait:hidden">{lines.join(" · ")}</span>
    </p>
  );
}

const toneClass: Record<Tone, string> = {
  normal: "text-phone-fg",
  prep: "text-phone-prep",
  go: "text-phone-go",
  alert: "text-phone-alert",
  dim: "text-phone-dim",
};

const barClass: Record<Tone, string> = {
  normal: "bg-phone-fg",
  prep: "bg-phone-prep",
  go: "bg-phone-go",
  alert: "bg-phone-alert",
  dim: "bg-phone-dim",
};
