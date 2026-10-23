import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/coach/copy-button";
import { useModeLabel } from "@/components/timer/use-mode-label";
import { Link } from "@/i18n/navigation";
import { formatCode } from "@/lib/share/code";
import type { Workout } from "@/lib/timer/schema";

/** What the coach sees after sending: one link, opened here or passed to another device. */
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
    <section className="flex flex-col gap-8">
      <header>
        <p className="text-sm font-semibold tracking-wide text-coach-muted">
          {modeLabel}
        </p>
        <h1 className="text-3xl font-black">{workout.name ?? t("title")}</h1>
      </header>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-coach-muted">
          {t("linkLabel")}
        </p>
        <a
          href={timerUrl}
          className="text-2xl font-bold break-all underline underline-offset-4 md:text-3xl"
        >
          {withoutProtocol(timerUrl)}
        </a>
        <p className="text-sm text-coach-muted">{t("expires")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-coach-line bg-coach-surface p-6">
          <h2 className="text-2xl font-black">{t("thisDevice")}</h2>
          <p className="text-lg text-coach-muted">{t("thisDeviceHow")}</p>
          <a
            href={timerUrl}
            className="inline-flex min-h-14 items-center justify-center self-start rounded-xl bg-coach-fg px-6 text-lg font-bold text-coach-bg hover:opacity-90"
          >
            {t("openHere")}
          </a>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-coach-line bg-coach-surface p-6">
          <h2 className="text-2xl font-black">{t("otherDevice")}</h2>
          <p className="text-lg text-coach-muted">{t("otherDeviceHow")}</p>
          <CopyButton value={timerUrl} label={t("copyLink")} />
          <p className="text-lg text-coach-muted">{t("orScan")}</p>
          {/* Always black on white, so phones scan it even in dark mode. */}
          <div
            role="img"
            aria-label={t("scanAlt")}
            className="w-56 rounded-2xl bg-white p-3 shadow-sm [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </section>
      </div>

      <div className="rounded-2xl border border-coach-line p-6">
        <h2 className="text-lg font-bold">{t("howTitle")}</h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">{t("iphone")}</dt>
            <dd className="text-coach-muted">
              {/* The installed app opens on the code screen, so iPhones still need the code. */}
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
            <dt className="font-semibold">{t("android")}</dt>
            <dd className="text-coach-muted">{t("androidHow")}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/coach"
          className="inline-flex min-h-12 items-center rounded-xl border border-coach-line px-5 font-semibold hover:bg-coach-surface"
        >
          {t("newWorkout")}
        </Link>
      </div>
    </section>
  );
}

function withoutProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
