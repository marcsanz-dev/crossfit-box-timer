import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { useModeLabel } from "@/components/timer/use-mode-label";
import { Link } from "@/i18n/navigation";
import { DEMO_SLUGS, getDemoWorkout, type DemoSlug } from "@/lib/timer/demos";
import { phoneMetadata } from "../phone-metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/t/demo">): Promise<Metadata> {
  const { locale } = await params;
  return phoneMetadata(locale, "/t/demo");
}

export default function DemoListPage() {
  const t = useTranslations("Demos");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-5 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black">{t("title")}</h1>
        <p className="text-lg text-phone-dim">{t("intro")}</p>
      </header>
      <ul className="flex flex-col gap-3">
        {DEMO_SLUGS.map((slug) => (
          <li key={slug}>
            <DemoLink slug={slug} />
          </li>
        ))}
      </ul>
    </main>
  );
}

function DemoLink({ slug }: { slug: DemoSlug }) {
  const t = useTranslations("Demos");
  const workout = getDemoWorkout(slug, useLocale());
  const modeLabel = useModeLabel(workout);

  return (
    <Link
      href={`/t/demo/${slug}`}
      className="flex flex-col gap-1 rounded-2xl bg-phone-surface p-5 transition hover:bg-phone-line focus-visible:outline-2 focus-visible:outline-phone-fg"
    >
      <span className="text-2xl font-bold">{workout.name}</span>
      <span className="font-semibold tracking-wide text-phone-prep">
        {modeLabel}
      </span>
      {slug === "quick" && <span className="text-phone-dim">{t("quick")}</span>}
      {slug === "full-hour" && (
        <span className="text-phone-dim">{t("fullHour")}</span>
      )}
    </Link>
  );
}
