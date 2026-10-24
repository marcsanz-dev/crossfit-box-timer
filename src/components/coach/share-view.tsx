import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/coach/copy-button";
import { useModeLabel } from "@/components/timer/use-mode-label";
import { Link } from "@/i18n/navigation";
import { formatCode } from "@/lib/share/code";
import type { Workout } from "@/lib/timer/schema";

/**
 * What the coach sees after sending: one link, passed to another device (the
 * usual case, so it comes first) or opened here. Sized to fit one desktop screen.
 */
export function ShareView({
  code,
  workout,
  qrSvg,
  timerUrl,
}: {
  code: string;
  workout: Workout;
  qrSvg: string;
  timerUrl: string;
}) {
  const t = useTranslations("Share");
  const modeLabel = useModeLabel(workout);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-coach-muted">
            {modeLabel}
          </p>
          <h1 className="text-3xl font-black">{workout.name ?? t("title")}</h1>
        </div>
        <Link
          href="/coach"
          className="inline-flex min-h-11 items-center rounded-xl border border-coach-line px-4 font-semibold hover:bg-coach-surface"
        >
          {t("newWorkout")}
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="grid gap-6 rounded-2xl border border-coach-line bg-coach-surface p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-2xl font-black">{t("otherDevice")}</h2>
            <p className="text-lg text-coach-muted">{t("otherDeviceHow")}</p>
            <CopyButton value={timerUrl} label={t("copyLink")} />
          </div>
          <figure className="flex w-40 flex-col gap-2">
            {/* Always black on white, so phones scan it even in dark mode. */}
            <div
              role="img"
              aria-label={t("scanAlt")}
              className="rounded-2xl bg-white p-2 shadow-sm [&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <figcaption className="text-sm text-coach-muted">
              {t("orScan")}
            </figcaption>
          </figure>
        </section>

        <section className="flex flex-col items-start gap-4 rounded-2xl border border-coach-line bg-coach-surface p-5">
          <h2 className="text-2xl font-black">{t("thisDevice")}</h2>
          <p className="text-lg text-coach-muted">{t("thisDeviceHow")}</p>
          <a
            href={timerUrl}
            className="inline-flex min-h-14 items-center justify-center rounded-xl bg-coach-fg px-6 text-lg font-bold text-coach-bg hover:opacity-90"
          >
            {t("openHere")}
          </a>
        </section>
      </div>

      <div className="rounded-2xl border border-coach-line p-5">
        <h2 className="font-bold">{t("howTitle")}</h2>
        <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="inline font-semibold">{t("iphone")}: </dt>
            <dd className="inline text-coach-muted">
              {/* An app installed earlier opens on the code screen, so it still needs the code. */}
              {t.rich("iphoneHow", {
                code: formatCode(code),
                strong: (chunks) => (
                  <strong className="font-mono font-black whitespace-nowrap text-coach-fg">
                    {chunks}
                  </strong>
                ),
              })}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold">{t("android")}: </dt>
            <dd className="inline text-coach-muted">{t("androidHow")}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
