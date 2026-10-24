import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TimerScreen } from "@/components/timer/timer-screen";
import { DEMO_SLUGS, DEMO_WORKOUTS, isDemoSlug } from "@/lib/timer/demos";
import { phoneMetadata } from "../../phone-metadata";

export function generateStaticParams() {
  return DEMO_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/t/demo/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  return phoneMetadata(
    locale,
    isDemoSlug(slug) ? `/t/demo/${slug}` : "/t/demo",
  );
}

export default async function DemoTimerPage({
  params,
}: PageProps<"/[locale]/t/demo/[slug]">) {
  const { slug } = await params;
  if (!isDemoSlug(slug)) notFound();

  return (
    <TimerScreen
      workout={DEMO_WORKOUTS[slug]}
      sessionKey={`demo:${slug}`}
      exitHref="/t/demo"
    />
  );
}
