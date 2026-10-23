import type { Viewport } from "next";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/i18n/navigation";

// The coach area supports both themes, so browsers must not auto-darken it.
export const viewport: Viewport = { colorScheme: "light dark" };

/** Coach area (desktop): neutral "CrossFit Box" identity, light or dark. */
export default function CoachLayout({
  children,
}: LayoutProps<"/[locale]/coach">) {
  const t = useTranslations("Coach");

  return (
    <div className="flex min-h-dvh flex-col bg-coach-bg text-coach-fg">
      <header className="border-b border-coach-line">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/coach" className="text-lg font-black tracking-tight">
            {t("brand")}
            <span className="ml-2 font-medium text-coach-muted">
              {t("area")}
            </span>
          </Link>
          <LocaleSwitcher />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
        {children}
      </main>
    </div>
  );
}
