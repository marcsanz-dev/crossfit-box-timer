import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { Suspense } from "react";
import { SignInButton, SignOutButton } from "@/components/coach/auth-buttons";
import { CoachWorkspace } from "@/components/coach/coach-workspace";
import { getAuth } from "@/auth/server";
import { listPresets, type PresetLists } from "@/db/presets";

export default function CoachPage() {
  return (
    <Suspense fallback={<p className="text-coach-muted">…</p>}>
      <CoachGate />
    </Suspense>
  );
}

/**
 * The session is checked on the server for every request. Only accounts that
 * passed the coach rule at sign-in can have a session.
 */
async function CoachGate() {
  // Read the request headers first: that is where prerendering stops, so auth
  // (and its secrets) is only touched for real requests, never at build time.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return <SignInCard />;

  const t = await getTranslations("Coach");
  const tb = await getTranslations("Builder");
  // The builder still works when the presets can't be read.
  let presets: PresetLists | null = null;
  try {
    presets = await listPresets(session.user.id);
  } catch (error) {
    console.error("listPresets failed", error);
  }
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-coach-muted">
            {t("welcome", { name: session.user.name })} · {session.user.email}
          </p>
          <h1 className="mt-1 text-3xl font-black">{tb("title")}</h1>
          <p className="text-coach-muted">{tb("intro")}</p>
        </div>
        <SignOutButton />
      </div>
      <CoachWorkspace presets={presets} />
    </section>
  );
}

function SignInCard() {
  const t = useTranslations("Coach");
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-3xl border border-coach-line bg-coach-surface p-8 shadow-sm">
      <h1 className="text-3xl font-black">{t("signInTitle")}</h1>
      <p className="text-coach-muted">{t("signInBody")}</p>
      <SignInButton />
    </section>
  );
}
