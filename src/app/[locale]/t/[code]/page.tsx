import type { Metadata } from "next";
import { io } from "next/cache";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { PhoneFrame } from "@/components/timer/phone-frame";
import { TimerScreen } from "@/components/timer/timer-screen";
import { getSharedWorkout } from "@/db/shares";
import { Link } from "@/i18n/navigation";
import { isValidCode, normalizeCode } from "@/lib/share/code";
import { phoneMetadata } from "../phone-metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/t/[code]">): Promise<Metadata> {
  const { locale, code } = await params;
  const normalized = normalizeCode(safeDecode(code));
  return phoneMetadata(
    locale,
    isValidCode(normalized) ? `/t/${normalized}` : "/t",
  );
}

/** `decodeURIComponent` throws on a malformed escape such as `%E0`. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function SharedTimerPage({
  params,
}: PageProps<"/[locale]/t/[code]">) {
  return (
    <Suspense fallback={<PhoneFrame>{null}</PhoneFrame>}>
      <SharedTimer params={params} />
    </Suspense>
  );
}

/**
 * The only network request a phone makes: it downloads the workout snapshot
 * once, with no login. From here on the timer runs entirely on the phone.
 */
async function SharedTimer({
  params,
}: Pick<PageProps<"/[locale]/t/[code]">, "params">) {
  const { code: rawCode } = await params;
  // Shares expire, so the lookup (and its "now") belongs to each request, never
  // to the prerendered shell.
  await io();
  const code = normalizeCode(safeDecode(rawCode));
  // Malformed codes never reach the database.
  if (!isValidCode(code)) return <PhoneMessage kind="notFound" />;

  let workout;
  try {
    workout = await getSharedWorkout(code);
  } catch (error) {
    // A database or network hiccup must not leave the phone on a blank screen.
    console.error("Loading shared workout failed", error);
    return <PhoneMessage kind="loadFailed" retryHref={`/t/${code}`} />;
  }
  if (!workout) return <PhoneMessage kind="notFound" />;

  return (
    <TimerScreen workout={workout} sessionKey={`share:${code}`} exitHref="/t" />
  );
}

const MESSAGES = {
  notFound: { title: "notFoundTitle", body: "notFoundBody" },
  loadFailed: { title: "loadFailedTitle", body: "loadFailedBody" },
} as const;

function PhoneMessage({
  kind,
  retryHref,
}: {
  kind: keyof typeof MESSAGES;
  retryHref?: string;
}) {
  const t = useTranslations("PhoneHome");
  return (
    <PhoneFrame>
      <main
        role="alert"
        // The service worker never stores an error page for offline use, so a
        // hiccup can't replace a workout this phone already loaded.
        data-no-offline-cache={kind === "loadFailed" ? "" : undefined}
        className="mx-auto flex h-full w-full max-w-xl flex-col justify-center gap-[4cqmin] px-[6cqmin]"
      >
        <h1 className="text-[clamp(1.75rem,9cqmin,3.5rem)] leading-tight font-black">
          {t(MESSAGES[kind].title)}
        </h1>
        <p className="text-[clamp(1rem,4.4cqmin,1.4rem)] text-phone-dim">
          {t(MESSAGES[kind].body)}
        </p>
        <div className="flex flex-wrap gap-[3cqmin]">
          {retryHref && (
            // A full page load, so a dropped connection gets a clean retry.
            <a href={retryHref} className={buttonClass}>
              {t("retry")}
            </a>
          )}
          <Link href="/t" className={buttonClass}>
            {t("tryAgain")}
          </Link>
        </div>
      </main>
    </PhoneFrame>
  );
}

const buttonClass =
  "rounded-2xl bg-phone-fg px-[5cqmin] py-[3cqmin] text-[clamp(1.1rem,5cqmin,1.6rem)] font-bold text-black";
