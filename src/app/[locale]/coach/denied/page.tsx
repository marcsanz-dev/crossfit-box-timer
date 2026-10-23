import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SignInButton } from "@/components/coach/auth-buttons";
import { Link } from "@/i18n/navigation";

const KNOWN_ERRORS = ["not_a_coach", "email_not_verified"] as const;
type KnownError = (typeof KNOWN_ERRORS)[number];

export default function DeniedPage({
  searchParams,
}: PageProps<"/[locale]/coach/denied">) {
  return (
    <Suspense>
      <DeniedMessage searchParams={searchParams} />
    </Suspense>
  );
}

/** Shown when Google sign-in is rejected (for example, not a @yaqbot.com account). */
async function DeniedMessage({
  searchParams,
}: Pick<PageProps<"/[locale]/coach/denied">, "searchParams">) {
  const t = await getTranslations("Coach");
  const { error } = await searchParams;
  const code = KNOWN_ERRORS.find((known) => known === error);
  const message = code ? t(messageKey[code]) : t("deniedGeneric");

  return (
    <section
      role="alert"
      className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-3xl border border-coach-line bg-coach-surface p-8 shadow-sm"
    >
      <h1 className="text-3xl font-black">{t("deniedTitle")}</h1>
      <p className="text-coach-muted">{message}</p>
      <SignInButton label={t("tryAnother")} />
      <Link href="/" className="text-sm underline-offset-4 hover:underline">
        {t("backHome")}
      </Link>
    </section>
  );
}

const messageKey = {
  not_a_coach: "deniedNotACoach",
  email_not_verified: "deniedEmailNotVerified",
} as const satisfies Record<KnownError, string>;
