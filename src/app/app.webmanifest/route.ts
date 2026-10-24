import { getTranslations } from "next-intl/server";
import type { NextRequest } from "next/server";
import { buildManifest, parsePhoneStart } from "@/lib/pwa/manifest";

/**
 * The web app manifest of a phone page (`?start=/t/K7QM4P`). It is served per
 * page so the installed app opens the page it was added from.
 */
export async function GET(request: NextRequest) {
  const start = parsePhoneStart(request.nextUrl.searchParams.get("start"));
  const t = await getTranslations({
    locale: start.locale,
    namespace: "Manifest",
  });
  const manifest = buildManifest(start, {
    name: t("name"),
    shortName: t("shortName"),
    description: t("description"),
  });
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
