import type { Metadata } from "next";
import { CodeEntry } from "@/components/timer/code-entry";
import { PhoneFrame } from "@/components/timer/phone-frame";
import { phoneMetadata } from "./phone-metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/t">): Promise<Metadata> {
  const { locale } = await params;
  return phoneMetadata(locale, "/t");
}

export default function PhoneHomePage() {
  return (
    <PhoneFrame>
      <CodeEntry />
    </PhoneFrame>
  );
}
