"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const currentLocale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")}>
      <ul className="flex gap-4 text-sm">
        {routing.locales.map((locale) => (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              aria-current={locale === currentLocale ? "true" : undefined}
              className="underline-offset-4 hover:underline aria-[current]:font-semibold"
            >
              {t(locale)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
