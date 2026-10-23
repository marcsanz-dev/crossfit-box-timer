import { hasLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Suspense } from "react";
import { getAuth } from "@/auth/server";
import { useModeLabel } from "@/components/timer/use-mode-label";
import { getSharedWorkout } from "@/db/shares";
import { getServerEnv } from "@/env";
import { getPathname, Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatCode, isValidCode, normalizeCode } from "@/lib/share/code";
import type { Workout } from "@/lib/timer/schema";

export default function SharePage({
  params,
}: PageProps<"/[locale]/coach/share/[code]">) {
  return (
    <Suspense fallback={<p className="text-coach-muted">…</p>}>
      <ShareContent params={params} />
    </Suspense>
  );
}

async function ShareContent({
  params,
}: Pick<PageProps<"/[locale]/coach/share/[code]">, "params">) {
  const { code: rawCode, locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) redirect({ href: "/coach", locale });

  const t = await getTranslations("Share");
  const code = normalizeCode(rawCode);
  const workout = isValidCode(code) ? await getSharedWorkout(code) : null;
  if (!workout) {
    return (
      <section role="alert" className="flex flex-col items-start gap-4">
        <p className="text-lg">{t("notFound")}</p>
        <Link
          href="/coach"
          className="font-semibold underline underline-offset-4"
        >
          {t("newWorkout")}
        </Link>
      </section>
    );
  }

  const base = getServerEnv().BETTER_AUTH_URL;
  // The phone opens the workout in the coach's current language.
  const timerUrl = new URL(
    getPathname({ href: `/t/${code}`, locale }),
    base,
  ).toString();
  const homeUrl = new URL(getPathname({ href: "/t", locale }), base);
  const qrSvg = await QRCode.toString(timerUrl, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });

  return (
    <ShareView
      code={code}
      workout={workout}
      qrSvg={qrSvg}
      phoneHome={`${homeUrl.host}${homeUrl.pathname}`}
    />
  );
}

function ShareView({
  code,
  workout,
  qrSvg,
  phoneHome,
}: {
  code: string;
  workout: Workout;
  qrSvg: string;
  phoneHome: string;
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
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-coach-muted">
            {t("codeLabel")}
          </p>
          <p className="font-mono text-6xl font-black tracking-[0.15em] tabular-nums md:text-7xl">
            {formatCode(code)}
          </p>
          <p className="text-coach-muted">{t("orType", { url: phoneHome })}</p>
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
        <Link
          href={`/t/${code}`}
          className="inline-flex min-h-12 items-center rounded-xl border border-coach-line px-5 font-semibold hover:bg-coach-surface"
        >
          {t("openHere")}
        </Link>
      </div>
    </section>
  );
}
