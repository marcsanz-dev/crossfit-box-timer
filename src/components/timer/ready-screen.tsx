"use client";

import { useTranslations } from "next-intl";
import { useClientEnvironment } from "@/hooks/use-client-environment";
import { Link } from "@/i18n/navigation";
import type { Workout } from "@/lib/timer/schema";
import { useModeLabel } from "./use-mode-label";

interface ReadyScreenProps {
  workout: Workout;
  exitHref: string;
  onStart: () => void;
}

/**
 * Workout summary, device checklist and the single Start tap.
 * - It fits inside PhoneFrame, without scrolling: sizes follow the frame (cqmin).
 * - Only the workout details may shrink, because they are the only part whose
 *   length the coach decides.
 */
export function ReadyScreen({ workout, exitHref, onStart }: ReadyScreenProps) {
  const t = useTranslations("Timer");
  const modeLabel = useModeLabel(workout);
  const env = useClientEnvironment();
  const showInstallHint = env?.isIOS === true && !env.isStandalone;
  const showWakeLockWarning = env !== null && !env.wakeLockSupported;

  return (
    <main className="mx-auto grid h-full w-full max-w-5xl grid-rows-[minmax(0,1fr)_auto] gap-[4cqmin] px-[5cqmin] py-[4cqmin] text-[clamp(0.8rem,3.6cqmin,1rem)] landscape:grid-cols-2 landscape:grid-rows-1 landscape:items-center">
      <section className="flex min-h-0 flex-col gap-[2cqmin] self-stretch overflow-hidden landscape:justify-center">
        <Link
          href={exitHref}
          className="w-fit shrink-0 text-phone-dim underline-offset-4 hover:underline"
        >
          ← {t("exit")}
        </Link>
        <p className="shrink-0 text-[clamp(1rem,5cqmin,1.5rem)] font-bold tracking-wide text-phone-prep">
          {modeLabel}
        </p>
        {workout.name && (
          <h1 className="line-clamp-2 shrink-0 text-[clamp(1.6rem,9cqmin,3.5rem)] leading-tight font-black text-balance">
            {workout.name}
          </h1>
        )}
        <WorkoutDetails workout={workout} />
      </section>

      <section className="flex flex-col gap-[3cqmin]">
        <div className="flex flex-col gap-[1.5cqmin]">
          {/*
            Disabled until hydrated: the server-rendered button would otherwise
            swallow a very early tap without starting anything.
          */}
          <button
            type="button"
            onClick={onStart}
            disabled={env === null}
            className="min-h-[clamp(3.5rem,17cqmin,6rem)] rounded-3xl bg-phone-go text-[clamp(1.5rem,8cqmin,2.5rem)] font-black tracking-wide text-black uppercase shadow-lg shadow-phone-go/20 transition active:scale-[0.98] disabled:opacity-60"
          >
            {t("start")}
          </button>
          <p className="text-center text-phone-dim">{t("startHint")}</p>
        </div>

        {showWakeLockWarning && (
          <p role="alert" className={warningClass}>
            {t("wakeLockUnsupported")}
          </p>
        )}
        {showInstallHint && <p className={warningClass}>{t("installIos")}</p>}

        <div className="rounded-2xl bg-phone-surface px-[3cqmin] py-[2.5cqmin]">
          <h2 className="font-semibold text-phone-dim">
            {t("checklistTitle")}
          </h2>
          <ul className="mt-[1cqmin] flex list-disc flex-col gap-[0.5cqmin] pl-5 leading-snug">
            <li>{t("checkVolume")}</li>
            <li>{t("checkPower")}</li>
            <li>{t("checkControls")}</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

/** Description and EMOM stations: the only flexible block, clamped if it is very long. */
function WorkoutDetails({ workout }: { workout: Workout }) {
  const stations = workout.mode === "emom" ? workout.stations : [];
  if (!workout.description && stations.length === 0) return null;

  return (
    <div className="flex min-h-0 flex-col gap-[1.5cqmin] overflow-hidden text-[clamp(0.95rem,4.6cqmin,1.4rem)] leading-snug">
      {workout.description && (
        <p className="line-clamp-6 whitespace-pre-line text-phone-dim">
          {workout.description}
        </p>
      )}
      {stations.length > 0 && (
        <ol className="flex flex-col gap-[0.5cqmin]">
          {stations.map((station, index) => (
            <li key={index} className="truncate">
              <span className="text-phone-dim tabular-nums">{index + 1}. </span>
              {station}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const warningClass =
  "rounded-2xl border border-phone-prep/40 bg-phone-prep/10 px-[3cqmin] py-[2cqmin] leading-snug text-phone-prep";
