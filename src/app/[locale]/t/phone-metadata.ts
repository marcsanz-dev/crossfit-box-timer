import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { manifestHref } from "@/lib/pwa/manifest";

/** Links a phone page to its own web app manifest, so it installs as itself. */
export function phoneMetadata(locale: string, href: string): Metadata {
  if (!hasLocale(routing.locales, locale)) return {};
  return { manifest: manifestHref(getPathname({ href, locale })) };
}
