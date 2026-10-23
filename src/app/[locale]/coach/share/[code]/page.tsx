import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Suspense } from "react";
import { getAuth } from "@/auth/server";
import { ShareView } from "@/components/coach/share-view";
import { getSharedWorkout } from "@/db/shares";
import { getServerEnv } from "@/env";
import { getPathname, Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isValidCode, normalizeCode } from "@/lib/share/code";

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
      timerUrl={timerUrl}
    />
  );
}
