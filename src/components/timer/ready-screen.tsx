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

/** Workout summary, device checklist and the single Start tap. */
export function ReadyScreen({ workout, exitHref, onStart }: ReadyScreenProps) {
  const t = useTranslations("Timer");
  const modeLabel = useModeLabel(workout);
  const env = useClientEnvironment();
  const showInstallHint = env?.isIOS === true && !env.isStandalone;

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-5xl content-center gap-8 px-5 py-8 landscape:grid-cols-2 landscape:items-center short:gap-5 short:py-4">
      <section className="flex flex-col gap-4 short:gap-2">
        <Link
          href={exitHref}
          className="w-fit text-base text-phone-dim underline-offset-4 hover:underline"
        >
          ← {t("exit")}
        </Link>
        <p className="text-xl font-bold tracking-wide text-phone-prep">
          {modeLabel}
        </p>
        {workout.name && (
          <h1 className="text-4xl font-black text-balance sm:text-5xl short:text-3xl">
            {workout.name}
          </h1>
        )}
        {workout.description && (
          <p className="text-xl leading-snug whitespace-pre-line text-phone-dim short:text-lg">
            {workout.description}
          </p>
        )}
        {workout.mode === "emom" && workout.stations.length > 0 && (
          <ol className="flex flex-col gap-1 text-xl short:text-lg">
            {workout.stations.map((station, index) => (
              <li key={index}>
                <span className="text-phone-dim tabular-nums">
                  {index + 1}.{" "}
                </span>
                {station}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-5 short:gap-3">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onStart}
            className="min-h-24 rounded-3xl bg-phone-go text-4xl font-black tracking-wide text-black uppercase shadow-lg shadow-phone-go/20 transition active:scale-[0.98] short:min-h-18 short:text-3xl"
          >
            {t("start")}
          </button>
          <p className="text-center text-base text-phone-dim">
            {t("startHint")}
          </p>
        </div>

        {env && !env.wakeLockSupported && (
          <p role="alert" className={warningClass}>
            {t("wakeLockUnsupported")}
          </p>
        )}
        {showInstallHint && <p className={warningClass}>{t("installIos")}</p>}

        <div className="rounded-2xl bg-phone-surface p-4 short:p-3">
          <h2 className="text-base font-semibold text-phone-dim short:text-sm">
            {t("checklistTitle")}
          </h2>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-base short:mt-1 short:gap-0.5 short:text-sm">
            <li>{t("checkVolume")}</li>
            <li>{t("checkPower")}</li>
            <li>{t("checkControls")}</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

const warningClass =
  "rounded-2xl border border-phone-prep/40 bg-phone-prep/10 p-4 text-base text-phone-prep";
