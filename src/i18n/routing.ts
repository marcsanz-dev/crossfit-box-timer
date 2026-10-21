import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en", "ca"],
  defaultLocale: "es",
  // Spanish URLs stay clean (`/coach`); others are prefixed (`/en/coach`).
  localePrefix: "as-needed",
  // Spanish is always the default; other languages are an explicit choice
  // (no redirect based on the browser's Accept-Language header).
  localeDetection: false,
});
