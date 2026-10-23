import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/i18n/navigation";

// Placeholder landing page; the real one is built in Phase 5.
export default function HomePage() {
  const t = useTranslations("Home");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-lg text-foreground/70">{t("tagline")}</p>
      <nav className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/coach"
          className="rounded-xl bg-foreground px-5 py-3 font-semibold text-background"
        >
          {t("coachLink")}
        </Link>
        <Link
          href="/t/demo"
          className="rounded-xl border border-foreground/20 px-5 py-3 font-semibold"
        >
          {t("demoLink")}
        </Link>
      </nav>
      <LocaleSwitcher />
    </main>
  );
}
