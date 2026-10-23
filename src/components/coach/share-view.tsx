import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/coach/copy-button";
import { useModeLabel } from "@/components/timer/use-mode-label";
import { Link } from "@/i18n/navigation";
import { formatCode } from "@/lib/share/code";
import type { Workout } from "@/lib/timer/schema";

/** What the coach sees after sending: QR, code and direct link, each easy to pass on. */
export function ShareView({
  code,
  workout,
  qrSvg,
  timerUrl,
  homeUrl,
}: {
  code: string;
  workout: Workout;
  qrSvg: string;
  timerUrl: string;
  homeUrl: string;
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

      <div className="grid items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)]">
        {/* Always black on white, so phones scan it even in dark mode. */}
        <div
          role="img"
          aria-label={t("scanAlt")}
          className="mx-auto w-64 rounded-2xl bg-white p-3 shadow-sm md:w-72 [&_svg]:h-auto [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-coach-muted">
              {t("codeLabel")}
            </p>
            <p className="font-mono text-6xl font-black tracking-[0.15em] tabular-nums md:text-7xl">
              {formatCode(code)}
            </p>
            <CopyButton value={formatCode(code)} label={t("copyCode")} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-coach-muted">
              {t("linkLabel")}
            </p>
            {/* A new tab keeps the QR on screen for the phone. */}
            <a
              href={timerUrl}
              target="_blank"
              rel="noopener"
              className="font-semibold break-all underline underline-offset-4"
            >
              {withoutProtocol(timerUrl)}
            </a>
            <CopyButton value={timerUrl} label={t("copyLink")} />
          </div>
          <p className="text-coach-muted">
            {t.rich("orType", {
              url: withoutProtocol(homeUrl),
              link: (chunks) => (
                <a
                  href={homeUrl}
                  target="_blank"
                  rel="noopener"
                  className="font-semibold break-all text-coach-fg underline underline-offset-4"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <p className="text-sm text-coach-muted">{t("expires")}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-coach-line bg-coach-surface p-6">
        <h2 className="text-lg font-bold">{t("howTitle")}</h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">{t("iphone")}</dt>
            <dd className="text-coach-muted">{t("iphoneHow")}</dd>
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
          className="inline-flex min-h-12 items-center rounded-xl bg-coach-fg px-5 font-semibold text-coach-bg hover:opacity-90"
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
