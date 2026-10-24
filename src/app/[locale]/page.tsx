import type { Viewport } from "next";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/i18n/navigation";

// Same neutral identity as the coach area, in the visitor's light or dark theme.
export const viewport: Viewport = { colorScheme: "light dark" };

/** Entry point: coaches go to the panel, the rig phone to the timer. */
export default function HomePage() {
  const t = useTranslations("Home");
  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <div className="flex min-h-dvh flex-col bg-coach-bg text-coach-fg">
      <header className="border-b border-coach-line">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <p className="flex items-center gap-2 text-lg font-black tracking-tight whitespace-nowrap">
            {/* eslint-disable-next-line @next/next/no-img-element -- a tiny static SVG */}
            <img src="/icon.svg" alt="" width={28} height={28} />
            {t("brand")}
          </p>
          <Suspense fallback={null}>
            <LocaleSwitcher />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="text-lg text-coach-muted sm:text-xl">{t("tagline")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <EntryCard
            title={t("coachTitle")}
            body={t("coachBody")}
            href="/coach"
            action={t("coachLink")}
            primary
          />
          <EntryCard
            title={t("phoneTitle")}
            body={t("phoneBody")}
            href="/t"
            action={t("phoneLink")}
          >
            <Link
              href="/t/demo"
              className="self-start text-sm font-semibold underline underline-offset-4"
            >
              {t("demoLink")}
            </Link>
          </EntryCard>
        </div>

        <section aria-labelledby="how-title" className="flex flex-col gap-4">
          <h2 id="how-title" className="text-lg font-bold">
            {t("howTitle")}
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-coach-fg font-bold text-coach-bg"
                >
                  {index + 1}
                </span>
                <span className="text-coach-muted">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}

function EntryCard({
  title,
  body,
  href,
  action,
  primary = false,
  children,
}: {
  title: string;
  body: string;
  href: "/coach" | "/t";
  action: string;
  primary?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-coach-line bg-coach-surface p-6">
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="flex-1 text-coach-muted">{body}</p>
      <Link
        href={href}
        className={`inline-flex min-h-12 items-center justify-center self-start rounded-xl px-5 font-bold ${
          primary
            ? "bg-coach-fg text-coach-bg hover:opacity-90"
            : "border-2 border-coach-fg hover:bg-coach-bg"
        }`}
      >
        {action}
      </Link>
      {children}
    </section>
  );
}
