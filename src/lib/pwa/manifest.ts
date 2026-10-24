import type { MetadataRoute } from "next";

export const MANIFEST_PATH = "/app.webmanifest";

type Locale = "es" | "en" | "ca";

export interface PhoneStart {
  /** The page the installed app opens, e.g. `/t`, `/en/t/K7QM4P`. */
  path: string;
  locale: Locale;
}

const DEFAULT_START: PhoneStart = { path: "/t", locale: "es" };

// Only phone pages (`/t`, `/t/CODE`, `/t/demo/SLUG`, with an optional locale
// prefix) can be a start URL, so the query can't point the app anywhere else.
const PHONE_PATH = /^\/(?:(en|ca)\/)?t(?:\/[A-Za-z0-9-]{1,40}){0,2}$/;

/** Reads the `start` query of the manifest URL, falling back to the phone home. */
export function parsePhoneStart(raw: string | null): PhoneStart {
  if (!raw) return DEFAULT_START;
  const match = PHONE_PATH.exec(raw);
  if (!match) return DEFAULT_START;
  return { path: raw, locale: (match[1] as Locale | undefined) ?? "es" };
}

/** The `<link rel="manifest">` URL for a phone page. */
export function manifestHref(path: string): string {
  return `${MANIFEST_PATH}?start=${encodeURIComponent(path)}`;
}

/**
 * The web app manifest for one phone page. Its start URL is that page, so an
 * iPhone that adds a workout to the Home Screen opens that workout, and one
 * that adds `/t` opens the code screen.
 */
export function buildManifest(
  start: PhoneStart,
  texts: { name: string; shortName: string; description: string },
): MetadataRoute.Manifest {
  return {
    // One id per page: installing a workout never replaces another install.
    id: start.path,
    name: texts.name,
    short_name: texts.shortName,
    description: texts.description,
    lang: start.locale,
    start_url: start.path,
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
